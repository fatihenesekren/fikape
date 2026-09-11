import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { checkContent } from "@/lib/reviewValidation";
import { logContentFilterHit } from "@/lib/contentFilterLog";
import { messageCreateSchema, formatZodError } from "@/lib/schemas";
import { createNotification } from "@/lib/notification";

// Usta'ya site-içi (maskeli) mesaj başlatma — "kullanıcı" tarafı. Bir
// (usta, başlatan kullanıcı) çifti için TEK thread; ikinci mesaj da bu
// uçtan gönderilirse var olan thread'e eklenir (find-or-create).
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Giriş gerekli." }, { status: 401 });

  const { id } = await params;
  const expertProfileId = parseInt(id);
  if (isNaN(expertProfileId)) return NextResponse.json({ error: "Geçersiz usta." }, { status: 400 });

  const parsed = messageCreateSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 });
  const { text } = parsed.data;

  const userId = parseInt(session.user.id);

  const [profile, user] = await Promise.all([
    prisma.expertProfile.findUnique({
      where: { id: expertProfileId },
      select: { id: true, userId: true, status: true },
    }),
    prisma.user.findUnique({ where: { id: userId }, select: { emailVerifiedAt: true } }),
  ]);
  if (!profile || profile.status !== "ACTIVE") {
    return NextResponse.json({ error: "Usta bulunamadı." }, { status: 404 });
  }
  if (profile.userId === userId) {
    return NextResponse.json({ error: "Kendinize mesaj gönderemezsiniz." }, { status: 403 });
  }
  if (!user?.emailVerifiedAt) {
    return NextResponse.json({ error: "Mesaj göndermek için e-posta adresinizi doğrulamanız gerekiyor." }, { status: 403 });
  }

  const blocked = await prisma.blockedUser.findFirst({
    where: {
      OR: [
        { blockerId: userId, blockedId: profile.userId },
        { blockerId: profile.userId, blockedId: userId },
      ],
    },
    select: { id: true },
  });
  if (blocked) {
    return NextResponse.json({ error: "Bu kullanıcıyla mesajlaşamazsınız." }, { status: 403 });
  }

  const contentCheck = checkContent(text);
  if (!contentCheck.ok) {
    logContentFilterHit({ userId, surface: "EXPERT_MESSAGE", rule: contentCheck.rule });
    return NextResponse.json({ error: contentCheck.error }, { status: 400 });
  }

  const thread = await prisma.expertMessageThread.upsert({
    where: { expertProfileId_initiatorId: { expertProfileId, initiatorId: userId } },
    create: { expertProfileId, initiatorId: userId },
    update: { lastMessageAt: new Date() },
    select: { id: true },
  });

  await prisma.expertMessage.create({
    data: { threadId: thread.id, senderId: userId, text },
  });

  createNotification({
    userId: profile.userId,
    type: "NEW_EXPERT_MESSAGE",
    message: "Usta profilinize site üzerinden yeni bir mesaj geldi",
    link: `/usta-mesajlarim/${thread.id}`,
  });

  return NextResponse.json({ ok: true, threadId: thread.id }, { status: 201 });
}
