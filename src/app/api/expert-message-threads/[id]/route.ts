import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// Görüşme detayı — yalnız iki taraf (başlatan kullanıcı, usta) görebilir.
// Okunmamış (karşı taraftan gelen) mesajlar bu istekte okunmuş sayılır.
export async function GET(
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
    select: {
      id: true, initiatorId: true,
      initiator: { select: { displayName: true } },
      expertProfile: {
        select: {
          slug: true, headline: true, userId: true,
          user: { select: { displayName: true } },
        },
      },
      messages: {
        select: { id: true, senderId: true, text: true, isRead: true, createdAt: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });
  if (!thread) return NextResponse.json({ error: "Görüşme bulunamadı." }, { status: 404 });

  const ustaUserId = thread.expertProfile.userId;
  if (userId !== thread.initiatorId && userId !== ustaUserId) {
    return NextResponse.json({ error: "Bu görüşmeye erişiminiz yok." }, { status: 403 });
  }

  await prisma.expertMessage.updateMany({
    where: { threadId, senderId: { not: userId }, isRead: false },
    data: { isRead: true },
  });

  return NextResponse.json({
    id: thread.id,
    expertProfileSlug: thread.expertProfile.slug,
    expertHeadline: thread.expertProfile.headline,
    counterpartName: userId === thread.initiatorId
      ? (thread.expertProfile.user.displayName ?? "Usta")
      : (thread.initiator.displayName ?? "Kullanıcı"),
    isUsta: userId === ustaUserId,
    messages: thread.messages.map((m) => ({
      id: m.id,
      text: m.text,
      isOwn: m.senderId === userId,
      createdAt: m.createdAt.toISOString(),
    })),
  });
}
