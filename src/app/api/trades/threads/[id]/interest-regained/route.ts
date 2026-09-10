import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notification";
import { isTradeMessagingEnabled } from "@/lib/features";

// "Yeniden ilgileniyorum" — "İlgilenmiyorum" (interest-lost) işaretini geri alır.
// Yalnızca işareti koyan taraf.
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isTradeMessagingEnabled()) {
    return NextResponse.json({ error: "Bu özellik geçici olarak kapalı." }, { status: 503 });
  }

  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Giriş gerekli." }, { status: 401 });

  const { id } = await params;
  const threadId = parseInt(id);
  if (isNaN(threadId)) return NextResponse.json({ error: "Görüşme bulunamadı." }, { status: 404 });

  const userId = Number(session.user.id);

  const thread = await prisma.messageThread.findUnique({
    where: { id: threadId },
    select: {
      id: true,
      initiatorId: true,
      interestLostByUserId: true,
      blockedByUserId: true,
      closedByUserId: true,
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
  if (thread.blockedByUserId != null || thread.closedByUserId != null) {
    return NextResponse.json({ error: "Bu görüşme kapalı." }, { status: 403 });
  }
  if (thread.interestLostByUserId !== userId) {
    return NextResponse.json({ error: "Bu işaret sana ait değil." }, { status: 409 });
  }

  const counterpartId = userId === thread.initiatorId ? thread.tradeListing.userId : thread.initiatorId;

  await prisma.messageThread.update({
    where: { id: threadId },
    data: { interestLostByUserId: null, interestLostAt: null },
  });

  const me = session.user.name?.trim() || "Bir kullanıcı";
  const vehicle = `${thread.tradeListing.product.brand.name} ${thread.tradeListing.product.model.name}`;
  createNotification({
    userId: counterpartId,
    type: "TRADE_INTEREST_LOST",
    message: `${me}, "${vehicle}" takasıyla yeniden ilgilendiğini belirtti.`,
    link: `/mesajlar/${threadId}`,
  });

  return NextResponse.json({ ok: true });
}
