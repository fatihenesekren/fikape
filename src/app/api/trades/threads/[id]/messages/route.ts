import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { messageCreateSchema, formatZodError } from "@/lib/schemas";
import { checkContent } from "@/lib/reviewValidation";
import { logContentFilterHit } from "@/lib/contentFilterLog";
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
      closedByUserId: true,
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

  const counterpartId = userId === thread.initiatorId ? thread.tradeListing.userId : thread.initiatorId;

  if (thread.blockedByUserId != null) {
    return NextResponse.json({ error: "Görüşme sonlandırıldı, mesaj gönderemezsiniz." }, { status: 403 });
  }
  // Soft "kapat" — istemci zaten compose kutusunu gizliyor; doğrudan API /
  // eski sekme üzerinden yazmayı da kapat (bkz. çift-thread fix güvenlik B1:
  // kapalı bir thread'e yönlendirilen kullanıcı cooldown'ı delemesin).
  if (thread.closedByUserId != null) {
    return NextResponse.json({ error: "Bu görüşme kapalı, mesaj gönderemezsiniz." }, { status: 403 });
  }
  // Kalıcı kullanıcı bloğu, thread'in kendi blockedByUserId alanı null olsa
  // bile (çiftin başka bir thread'inden engellendiyse) geçerli.
  const pairBlocked = await prisma.blockedUser.findFirst({
    where: {
      OR: [
        { blockerId: userId, blockedId: counterpartId },
        { blockerId: counterpartId, blockedId: userId },
      ],
    },
    select: { id: true },
  });
  if (pairBlocked) {
    return NextResponse.json({ error: "Bu kullanıcıyla iletişim kuramazsınız." }, { status: 403 });
  }
  if (!thread.tradeListing.isActive) {
    return NextResponse.json({ error: "Bu ilan artık takasa açık değil, mesaj gönderemezsiniz." }, { status: 403 });
  }

  const parsed = messageCreateSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 });
  }
  const { text } = parsed.data;

  const contentCheck = checkContent(text, { strict: true });
  if (!contentCheck.ok) {
    logContentFilterHit({ userId, surface: "TRADE_MESSAGE", rule: contentCheck.rule, threadId });
    return NextResponse.json({ error: contentCheck.error }, { status: 400 });
  }

  if (!(await checkRateLimit(`trade-message:${userId}`, HOURLY_MESSAGE_LIMIT, 60 * 60 * 1000))) {
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

  // Bildirim: "kimden / kaç" — dedupe yerine mevcut okunmamış bildirimi
  // güncelle (sayı + tarih tazelenir, listede öne çıkar). Sayı gerçek
  // okunmamış mesaj adedi (bu görüşmede, benden alıcıya).
  (async () => {
    const senderName = session.user.name?.trim() || "Bir kullanıcı";
    const unreadFromMe = await prisma.message.count({
      where: { threadId, senderId: userId, isRead: false },
    });
    const notifMsg =
      unreadFromMe > 1
        ? `${senderName} sana ${unreadFromMe} yeni mesaj gönderdi`
        : `${senderName} sana yeni bir mesaj gönderdi`;

    const existing = await prisma.notification.findFirst({
      where: { userId: recipientId, type: "NEW_TRADE_MESSAGE", link, isRead: false },
      select: { id: true },
    });
    if (existing) {
      await prisma.notification.update({
        where: { id: existing.id },
        data: { message: notifMsg, createdAt: new Date() },
      });
    } else {
      await createNotification({
        userId: recipientId,
        type: "NEW_TRADE_MESSAGE",
        message: notifMsg,
        link,
      });
    }
  })().catch(() => {});

  return NextResponse.json({ ok: true }, { status: 201 });
}
