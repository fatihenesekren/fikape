import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// Görüşmedeki karşı tarafı engelle — mevcut genel BlockedUser tablosu
// üzerinden (takas engellemesiyle aynı, kullanıcı çifti bazında kalıcı).
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Giriş gerekli." }, { status: 401 });

  const { id } = await params;
  const threadId = parseInt(id);
  if (isNaN(threadId)) return NextResponse.json({ error: "Geçersiz görüşme." }, { status: 400 });

  const userId = parseInt(session.user.id);

  const thread = await prisma.expertMessageThread.findUnique({
    where: { id: threadId },
    select: { initiatorId: true, expertProfile: { select: { userId: true } } },
  });
  if (!thread) return NextResponse.json({ error: "Görüşme bulunamadı." }, { status: 404 });

  const ustaUserId = thread.expertProfile.userId;
  if (userId !== thread.initiatorId && userId !== ustaUserId) {
    return NextResponse.json({ error: "Bu görüşmeye erişiminiz yok." }, { status: 403 });
  }
  const counterpartId = userId === thread.initiatorId ? ustaUserId : thread.initiatorId;

  await prisma.blockedUser.upsert({
    where: { blockerId_blockedId: { blockerId: userId, blockedId: counterpartId } },
    create: { blockerId: userId, blockedId: counterpartId },
    update: {},
  });

  return NextResponse.json({ ok: true });
}
