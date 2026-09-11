import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { checkContent } from "@/lib/reviewValidation";
import { logContentFilterHit } from "@/lib/contentFilterLog";
import { messageCreateSchema, formatZodError } from "@/lib/schemas";
import { createNotification } from "@/lib/notification";

// Var olan thread'e yanıt — iki taraftan da (mesajı başlatan kullanıcı veya usta) gelebilir.
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Giriş gerekli." }, { status: 401 });

  const { id } = await params;
  const threadId = parseInt(id);
  if (isNaN(threadId)) return NextResponse.json({ error: "Geçersiz görüşme." }, { status: 400 });

  const parsed = messageCreateSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 });
  const { text } = parsed.data;

  const userId = parseInt(session.user.id);

  const thread = await prisma.expertMessageThread.findUnique({
    where: { id: threadId },
    select: { id: true, initiatorId: true, expertProfile: { select: { userId: true } } },
  });
  if (!thread) return NextResponse.json({ error: "Görüşme bulunamadı." }, { status: 404 });

  const ustaUserId = thread.expertProfile.userId;
  if (userId !== thread.initiatorId && userId !== ustaUserId) {
    return NextResponse.json({ error: "Bu görüşmeye erişiminiz yok." }, { status: 403 });
  }
  const counterpartId = userId === thread.initiatorId ? ustaUserId : thread.initiatorId;

  const blocked = await prisma.blockedUser.findFirst({
    where: {
      OR: [
        { blockerId: userId, blockedId: counterpartId },
        { blockerId: counterpartId, blockedId: userId },
      ],
    },
    select: { id: true },
  });
  if (blocked) return NextResponse.json({ error: "Bu görüşme artık kullanılamıyor." }, { status: 403 });

  const contentCheck = checkContent(text);
  if (!contentCheck.ok) {
    logContentFilterHit({ userId, surface: "EXPERT_MESSAGE", rule: contentCheck.rule, threadId });
    return NextResponse.json({ error: contentCheck.error }, { status: 400 });
  }

  await prisma.$transaction([
    prisma.expertMessage.create({ data: { threadId, senderId: userId, text } }),
    prisma.expertMessageThread.update({ where: { id: threadId }, data: { lastMessageAt: new Date() } }),
  ]);

  createNotification({
    userId: counterpartId,
    type: "NEW_EXPERT_MESSAGE",
    message: "Usta görüşmenize yeni bir mesaj geldi",
    link: `/usta-mesajlarim/${threadId}`,
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}
