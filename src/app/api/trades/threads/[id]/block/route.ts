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
  const now = new Date();

  // Çift arası TÜM görüşmeleri kapsayan pair filtresi — engel tek bir thread'e
  // değil kullanıcı çiftine ait. Aksi halde başka bir ilandaki kardeş thread
  // blockedByUserId=null kalır ve engelli kullanıcı oradan yazmaya devam eder
  // (bkz. çift-thread fix güvenlik B2).
  const pairFilter = {
    OR: [
      { initiatorId: userId, tradeListing: { userId: counterpartId } },
      { initiatorId: counterpartId, tradeListing: { userId } },
    ],
  };

  // "Kişiyi engelle" — kalıcı, çift yönlü kullanıcı bloğu + çiftin tüm
  // görüşmelerini engelle/kapat. SESSİZ: engellenen kişiye bildirim gitmez.
  await prisma.$transaction([
    prisma.messageThread.updateMany({
      where: { ...pairFilter, blockedByUserId: null },
      data: { blockedByUserId: userId, blockedAt: now },
    }),
    // Kapanış alanlarını yalnızca henüz kapanmamışlara yaz — karşı tarafın
    // kapattığı görüşmelerde closedByUserId/closedAt ezilmesin.
    prisma.messageThread.updateMany({
      where: { ...pairFilter, closedByUserId: null },
      data: { closedByUserId: userId, closedAt: now },
    }),
    prisma.blockedUser.upsert({
      where: { blockerId_blockedId: { blockerId: userId, blockedId: counterpartId } },
      create: { blockerId: userId, blockedId: counterpartId },
      update: {},
    }),
  ]);

  return NextResponse.json({ ok: true });
}
