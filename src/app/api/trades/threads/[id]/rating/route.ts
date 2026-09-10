import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { tradeRatingSchema, formatZodError } from "@/lib/schemas";
import { checkContent } from "@/lib/reviewValidation";
import { logContentFilterHit } from "@/lib/contentFilterLog";
import { checkRateLimit } from "@/lib/rateLimit";
import { createNotification } from "@/lib/notification";

// Takas sonrası karşılıklı değerlendirme — sadece ilan "Takas oldu" ile
// kapandıktan sonra, o görüşmenin tarafları birbirini bir kez değerlendirebilir
// (bkz. denetim raporu, KRİTİK madde: "güven takas geçmişinden hiç birikmiyor").
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Giriş gerekli." }, { status: 401 });

  const { id } = await params;
  const threadId = parseInt(id);
  if (isNaN(threadId)) return NextResponse.json({ error: "Görüşme bulunamadı." }, { status: 404 });

  const userId = Number(session.user.id);

  const thread = await prisma.messageThread.findUnique({
    where: { id: threadId },
    select: {
      id: true,
      initiatorId: true,
      hasReciprocalReply: true,
      tradeListing: { select: { userId: true, closeReason: true } },
      initiatorListing: { select: { closeReason: true } },
    },
  });
  if (!thread || (thread.initiatorId !== userId && thread.tradeListing.userId !== userId)) {
    return NextResponse.json({ error: "Görüşme bulunamadı." }, { status: 404 });
  }
  // Görüşme birden fazla ilanı kapsayabilir (çift-thread birleştirme sonrası) —
  // ilanlardan HERHANGİ biri "Takas oldu" ile kapandıysa yeter. hasReciprocalReply
  // tabanı: iki taraf da yazmamış soğuk görüşmelerde davet çıkmasın (güvenlik C4).
  const anyTraded =
    thread.tradeListing.closeReason === "TRADED" ||
    thread.initiatorListing?.closeReason === "TRADED";
  if (!anyTraded || !thread.hasReciprocalReply) {
    return NextResponse.json({ error: "Bu görüşme henüz değerlendirmeye uygun değil." }, { status: 409 });
  }

  const ratedUserId = userId === thread.initiatorId ? thread.tradeListing.userId : thread.initiatorId;

  const parsed = tradeRatingSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 });
  }

  if (parsed.data.comment) {
    const c = checkContent(parsed.data.comment);
    if (!c.ok) {
      logContentFilterHit({ userId, surface: "TRADE_RATING", rule: c.rule, threadId });
      return NextResponse.json({ error: c.error }, { status: 400 });
    }
  }

  if (!(await checkRateLimit(`trade-rating:${userId}`, 20, 24 * 60 * 60 * 1000))) {
    return NextResponse.json({ error: "Günlük değerlendirme sınırına ulaştınız." }, { status: 429 });
  }

  try {
    await prisma.tradeRating.create({
      data: {
        threadId,
        raterId: userId,
        ratedUserId,
        score: parsed.data.score,
        comment: parsed.data.comment ?? null,
      },
    });
    // Önceden puan alan kullanıcı bunu ancak ilgili ilana tekrar girerek fark
    // ediyordu — hiçbir bildirim tipi karşılığı yoktu (bkz. boşluk raporu, ORTA madde).
    // Görüşme birden fazla aracı kapsayabildiği için mesajda araç adı geçmiyor.
    await createNotification({
      userId: ratedUserId,
      type: "TRADE_RATED",
      message: `Tamamladığınız bir takas için bir değerlendirme aldınız.`,
      link: `/mesajlar/${threadId}`,
    });
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Bu görüşmeyi zaten değerlendirdiniz." }, { status: 409 });
  }
}
