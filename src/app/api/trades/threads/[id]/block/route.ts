import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isTradeMessagingEnabled } from "@/lib/features";

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
    select: { id: true, initiatorId: true, tradeListing: { select: { userId: true } } },
  });
  if (!thread || (thread.initiatorId !== userId && thread.tradeListing.userId !== userId)) {
    return NextResponse.json({ error: "Görüşme bulunamadı." }, { status: 404 });
  }

  const counterpartId = userId === thread.initiatorId ? thread.tradeListing.userId : thread.initiatorId;

  await prisma.$transaction([
    prisma.messageThread.update({
      where: { id: threadId },
      data: { blockedByUserId: userId, blockedAt: new Date() },
    }),
    // Önceden blok sadece bu tek görüşmeyi donduruyordu; bloklanan kişi yeni bir
    // ilan/thread üzerinden tekrar ulaşabiliyordu (bkz. denetim raporu) — artık
    // kullanıcı çifti kalıcı olarak da bloklanıyor.
    prisma.blockedUser.upsert({
      where: { blockerId_blockedId: { blockerId: userId, blockedId: counterpartId } },
      create: { blockerId: userId, blockedId: counterpartId },
      update: {},
    }),
  ]);

  return NextResponse.json({ ok: true });
}
