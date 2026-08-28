import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notification";
import { isTradeMessagingEnabled } from "@/lib/features";

// "İlgimi kaybettim" — Block'tan (görüşmeyi/kişiyi tamamen kapatma) farklı,
// yumuşak bir sinyal: mesajlaşmayı KAPATMAZ, sadece karşı tarafa bildirim
// gönderir ve görüşmede görünür olur. Önceden sadece ilan sahibi ilanı
// kapatabiliyordu — görüşmeyi başlatan tarafın vazgeçtiğini belirtecek bir
// yolu yoktu, iki taraf da sessiz kalırsa ilan süresiz aktif kalıyordu
// (bkz. boşluk raporu, YÜKSEK madde).
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isTradeMessagingEnabled()) {
    return NextResponse.json({ error: "Bu özellik geçici olarak kapalı." }, { status: 503 });
  }

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
      interestLostByUserId: true,
      tradeListing: {
        select: {
          userId: true,
          id: true,
          product: { select: { brand: { select: { name: true } }, model: { select: { name: true } } } },
        },
      },
    },
  });
  if (!thread || (thread.initiatorId !== userId && thread.tradeListing.userId !== userId)) {
    return NextResponse.json({ error: "Görüşme bulunamadı." }, { status: 404 });
  }
  if (thread.interestLostByUserId != null) {
    return NextResponse.json({ error: "Bu görüşme zaten işaretlenmiş." }, { status: 409 });
  }

  const counterpartId = userId === thread.initiatorId ? thread.tradeListing.userId : thread.initiatorId;

  await prisma.messageThread.update({
    where: { id: threadId },
    data: { interestLostByUserId: userId, interestLostAt: new Date() },
  });

  const vehicleName = `${thread.tradeListing.product.brand.name} ${thread.tradeListing.product.model.name}`;
  await createNotification({
    userId: counterpartId,
    type: "TRADE_INTEREST_LOST",
    message: `Bir kullanıcı "${vehicleName}" ilanınız için yaptığınız görüşmeyle ilgisini kaybettiğini belirtti.`,
    link: `/mesajlar/${threadId}`,
  });

  return NextResponse.json({ ok: true });
}
