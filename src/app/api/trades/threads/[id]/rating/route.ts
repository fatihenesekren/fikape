import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { tradeRatingSchema, formatZodError } from "@/lib/schemas";
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
      tradeListing: {
        select: {
          userId: true,
          closeReason: true,
          product: { select: { brand: { select: { name: true } }, model: { select: { name: true } } } },
        },
      },
    },
  });
  if (!thread || (thread.initiatorId !== userId && thread.tradeListing.userId !== userId)) {
    return NextResponse.json({ error: "Görüşme bulunamadı." }, { status: 404 });
  }
  if (thread.tradeListing.closeReason !== "TRADED") {
    return NextResponse.json({ error: "Bu görüşme henüz değerlendirmeye uygun değil." }, { status: 409 });
  }

  const ratedUserId = userId === thread.initiatorId ? thread.tradeListing.userId : thread.initiatorId;

  const parsed = tradeRatingSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 });
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
    const vehicleName = `${thread.tradeListing.product.brand.name} ${thread.tradeListing.product.model.name}`;
    await createNotification({
      userId: ratedUserId,
      type: "TRADE_RATED",
      message: `"${vehicleName}" takasınız için bir değerlendirme aldınız.`,
      link: `/mesajlar/${threadId}`,
    });
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Bu görüşmeyi zaten değerlendirdiniz." }, { status: 409 });
  }
}
