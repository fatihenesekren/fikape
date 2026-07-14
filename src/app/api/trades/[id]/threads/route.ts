import { NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { messageCreateSchema, formatZodError } from "@/lib/schemas";
import { checkContent } from "@/lib/reviewValidation";
import { checkRateLimit } from "@/lib/rateLimit";
import { isTradeMessagingEnabled } from "@/lib/features";
import { createNotification } from "@/lib/notification";

const DAILY_THREAD_LIMIT = Number(process.env.TAKASA_AC_THREAD_GUNLUK_LIMIT) || 10;

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
  const listingId = parseInt(id);
  if (isNaN(listingId)) return NextResponse.json({ error: "İlan bulunamadı." }, { status: 404 });

  const userId = Number(session.user.id);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { trustLevel: true, isBanned: true },
  });
  if (!user || user.isBanned) {
    return NextResponse.json({ error: "Bu işlemi gerçekleştiremezsiniz." }, { status: 403 });
  }
  if (user.trustLevel < 3) {
    return NextResponse.json(
      { error: "Mesaj göndermek için garajınızda fotoğraflı, onaylanmış bir yorumunuz olması gerekiyor." },
      { status: 403 }
    );
  }

  const listing = await prisma.tradeListing.findUnique({
    where: { id: listingId },
    select: { id: true, userId: true, isActive: true },
  });
  if (!listing || !listing.isActive) {
    return NextResponse.json({ error: "İlan bulunamadı." }, { status: 404 });
  }
  if (listing.userId === userId) {
    return NextResponse.json({ error: "Kendi ilanınıza mesaj gönderemezsiniz." }, { status: 403 });
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

  if (!checkRateLimit(`trade-thread-create:${userId}`, DAILY_THREAD_LIMIT, 24 * 60 * 60 * 1000)) {
    return NextResponse.json({ error: "Günlük mesaj başlatma sınırına ulaştınız, yarın tekrar deneyiniz." }, { status: 429 });
  }

  let threadId: number;
  try {
    const thread = await prisma.messageThread.create({
      data: {
        tradeListingId: listingId,
        initiatorId: userId,
        messages: { create: { senderId: userId, text } },
      },
    });
    threadId = thread.id;
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return NextResponse.json({ error: "Bu ilana zaten bir mesaj gönderdiniz." }, { status: 409 });
    }
    throw e;
  }

  createNotification({
    userId: listing.userId,
    type: "TRADE_INTEREST",
    message: "Takas ilanınla ilgileniyorlar",
    link: `/mesajlar/${threadId}`,
  });

  return NextResponse.json({ ok: true, threadId }, { status: 201 });
}
