import { kullaniciLimiti } from "@/lib/userRateLimit";
import { NextResponse } from "next/server";
import { pozitifTamsayiId } from "@/lib/validateId";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notification";
import { isTradeMessagingEnabled } from "@/lib/features";

// "Görüşmeyi yeniden aç" — yalnızca KAPATAN kişi. Blok varsa (kişi engellendiyse)
// buradan açılamaz — engel Profil'den kaldırılmalı.
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
          isActive: true,
          product: { select: { brand: { select: { name: true } }, model: { select: { name: true } } } },
        },
      },
    },
  });
  if (!thread || (thread.initiatorId !== userId && thread.tradeListing.userId !== userId)) {
    return NextResponse.json({ error: "Görüşme bulunamadı." }, { status: 404 });
  }
  if (thread.blockedByUserId != null) {
    return NextResponse.json({ error: "Engellenen bir görüşme yeniden açılamaz." }, { status: 409 });
  }
  if (thread.closedByUserId == null) {
    return NextResponse.json({ error: "Bu görüşme zaten açık." }, { status: 409 });
  }
  if (thread.closedByUserId !== userId) {
    return NextResponse.json({ error: "Bu görüşmeyi yalnızca kapatan taraf yeniden açabilir." }, { status: 403 });
  }
  if (!thread.tradeListing.isActive) {
    return NextResponse.json({ error: "İlan artık aktif olmadığı için görüşme yeniden açılamaz." }, { status: 409 });
  }

  const counterpartId = userId === thread.initiatorId ? thread.tradeListing.userId : thread.initiatorId;

  await prisma.messageThread.update({
    where: { id: threadId },
    data: { closedByUserId: null, closedAt: null },
  });

  const me = session.user.name?.trim() || "Bir kullanıcı";
  const vehicle = `${thread.tradeListing.product.brand.name} ${thread.tradeListing.product.model.name}`;
  createNotification({
    userId: counterpartId,
    type: "TRADE_THREAD_REOPENED",
    message: `${me}, "${vehicle}" görüşmesini yeniden açtı.`,
    link: `/mesajlar/${threadId}`,
  });

  return NextResponse.json({ ok: true });
}
