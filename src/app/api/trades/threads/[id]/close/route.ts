import { kullaniciLimiti } from "@/lib/userRateLimit";
import { NextResponse } from "next/server";
import { pozitifTamsayiId } from "@/lib/validateId";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notification";
import { isTradeMessagingEnabled } from "@/lib/features";

// "Görüşmeyi kapat" — yumuşak arşiv. Kişi ENGELLENMEZ; karşı taraf başka/aynı
// ilandan yeni görüşme açabilir (kapatan kişiye karşı CLOSE_COOLDOWN_DAYS
// friction'ı /api/trades/[id]/threads'te uygulanır). Yalnızca kapatan
// "yeniden aç" edebilir. Her iki taraf da kapatabilir.
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isTradeMessagingEnabled()) {
    return NextResponse.json({ error: "Bu özellik geçici olarak kapalı." }, { status: 503 });
  }

  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Giriş gerekli." }, { status: 401 });
  // Her adım karşı tarafa bildirim üretir: aç/kapat ve ilgi döngüleriyle bildirim selini önlemek için saatlik sınır
  const limit = await kullaniciLimiti(session, "thread-close", 20, 60 * 60 * 1000);
  if (limit) return limit;

  const { id } = await params;
  const threadId = pozitifTamsayiId(id) ?? NaN;
  if (isNaN(threadId)) return NextResponse.json({ error: "Görüşme bulunamadı." }, { status: 404 });

  const userId = Number(session.user.id);

  const thread = await prisma.messageThread.findUnique({
    where: { id: threadId },
    select: {
      id: true,
      initiatorId: true,
      closedByUserId: true,
      blockedByUserId: true,
      tradeListing: {
        select: {
          userId: true,
          product: { select: { brand: { select: { name: true } }, model: { select: { name: true } } } },
        },
      },
    },
  });
  if (!thread || (thread.initiatorId !== userId && thread.tradeListing.userId !== userId)) {
    return NextResponse.json({ error: "Görüşme bulunamadı." }, { status: 404 });
  }
  if (thread.blockedByUserId != null) {
    return NextResponse.json({ error: "Bu görüşme zaten kapalı." }, { status: 409 });
  }
  if (thread.closedByUserId != null) {
    return NextResponse.json({ error: "Bu görüşme zaten kapalı." }, { status: 409 });
  }

  const counterpartId = userId === thread.initiatorId ? thread.tradeListing.userId : thread.initiatorId;

  // Görüşme kapanınca paylaşılan numaralar da silinir (yeniden açılırsa yeniden paylaşım gerekir); rıza ispatı ConsentLog'da kalır.
  await prisma.$transaction([
    prisma.messageThread.update({
      where: { id: threadId },
      data: { closedByUserId: userId, closedAt: new Date() },
    }),
    prisma.threadPhoneShare.deleteMany({ where: { threadId } }),
  ]);

  const me = session.user.name?.trim() || "Bir kullanıcı";
  const vehicle = `${thread.tradeListing.product.brand.name} ${thread.tradeListing.product.model.name}`;
  createNotification({
    userId: counterpartId,
    type: "TRADE_THREAD_CLOSED",
    message: `${me}, "${vehicle}" görüşmesini kapattı.`,
    link: `/mesajlar/${threadId}`,
  });

  return NextResponse.json({ ok: true });
}
