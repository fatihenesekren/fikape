import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { messageCreateSchema, formatZodError } from "@/lib/schemas";
import { checkContent } from "@/lib/reviewValidation";
import { checkRateLimit } from "@/lib/rateLimit";
import { isTradeMessagingEnabled } from "@/lib/features";
import { createNotification } from "@/lib/notification";

const HOURLY_MESSAGE_LIMIT = Number(process.env.TAKASA_AC_MESAJ_SAATLIK_LIMIT) || 30;

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
      blockedByUserId: true,
      tradeListing: { select: { userId: true, isActive: true } },
    },
  });
  if (!thread || (thread.initiatorId !== userId && thread.tradeListing.userId !== userId)) {
    return NextResponse.json({ error: "Görüşme bulunamadı." }, { status: 404 });
  }

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { isBanned: true } });
  if (!user || user.isBanned) {
    return NextResponse.json({ error: "Bu işlemi gerçekleştiremezsiniz." }, { status: 403 });
  }

  if (thread.blockedByUserId != null) {
    return NextResponse.json({ error: "Görüşme sonlandırıldı, mesaj gönderemezsiniz." }, { status: 403 });
  }
  if (!thread.tradeListing.isActive) {
    return NextResponse.json({ error: "Bu ilan artık takasa açık değil, mesaj gönderemezsiniz." }, { status: 403 });
  }

  const parsed = messageCreateSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 });
  }
  const { text } = parsed.data;

  const contentCheck = checkContent(text);
  if (!contentCheck.ok) {
    return NextResponse.json({ error: contentCheck.error }, { status: 400 });
  }

  if (!checkRateLimit(`trade-message:${userId}`, HOURLY_MESSAGE_LIMIT, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "Saatlik mesaj gönderme sınırına ulaştınız, biraz sonra tekrar deneyiniz." }, { status: 429 });
  }

  const isOwnerReplying = userId === thread.tradeListing.userId;

  await prisma.$transaction([
    prisma.message.create({ data: { threadId, senderId: userId, text } }),
    prisma.messageThread.update({
      where: { id: threadId },
      data: {
        lastMessageAt: new Date(),
        ...(isOwnerReplying ? { hasReciprocalReply: true } : {}),
      },
    }),
  ]);

  const recipientId = userId === thread.initiatorId ? thread.tradeListing.userId : thread.initiatorId;
  const link = `/mesajlar/${threadId}`;

  prisma.notification
    .findFirst({ where: { userId: recipientId, type: "NEW_TRADE_MESSAGE", link, isRead: false } })
    .then((existing) => {
      if (!existing) {
        createNotification({
          userId: recipientId,
          type: "NEW_TRADE_MESSAGE",
          message: "Takas görüşmene yeni bir mesaj geldi",
          link,
        });
      }
    })
    .catch(() => {});

  return NextResponse.json({ ok: true }, { status: 201 });
}
