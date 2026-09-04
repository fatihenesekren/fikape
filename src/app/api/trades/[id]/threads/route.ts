import { NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { threadCreateSchema, formatZodError } from "@/lib/schemas";
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

  // Taraflardan biri diğerini daha önce kalıcı olarak bloklamışsa (bkz. block/route.ts),
  // yeni bir ilan üzerinden tekrar temas kurulmasını engelle.
  const blocked = await prisma.blockedUser.findFirst({
    where: {
      OR: [
        { blockerId: userId, blockedId: listing.userId },
        { blockerId: listing.userId, blockedId: userId },
      ],
    },
    select: { id: true },
  });
  if (blocked) {
    return NextResponse.json({ error: "Bu kullanıcıyla iletişim kuramazsınız." }, { status: 403 });
  }

  const parsed = threadCreateSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 });
  }
  const { text } = parsed.data;
  const initiatorListingIdRaw = parsed.data.initiatorListingId;
  const initiatorListingId = initiatorListingIdRaw != null ? Number(initiatorListingIdRaw) : null;

  const contentCheck = checkContent(text);
  if (!contentCheck.ok) {
    return NextResponse.json({ error: contentCheck.error }, { status: 400 });
  }

  // Seçilen ilan gerçekten mesajı atana mı ait ve hâlâ aktif mi — client
  // tarafındaki listeden seçilse bile araya girip başkasının ilanını ya da
  // kapanmış bir ilanı iliştirmesin diye sunucuda yeniden doğrulanıyor.
  if (initiatorListingId != null) {
    const ownListing = await prisma.tradeListing.findUnique({
      where: { id: initiatorListingId },
      select: { userId: true, isActive: true },
    });
    if (!ownListing || ownListing.userId !== userId || !ownListing.isActive) {
      return NextResponse.json({ error: "Seçtiğiniz ilan geçersiz." }, { status: 400 });
    }
  }

  if (!(await checkRateLimit(`trade-thread-create:${userId}`, DAILY_THREAD_LIMIT, 24 * 60 * 60 * 1000))) {
    return NextResponse.json({ error: "Günlük mesaj başlatma sınırına ulaştınız, yarın tekrar deneyiniz." }, { status: 429 });
  }

  let threadId: number;
  try {
    const thread = await prisma.messageThread.create({
      data: {
        tradeListingId: listingId,
        initiatorId: userId,
        initiatorListingId,
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
