import { NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { threadCreateSchema, formatZodError } from "@/lib/schemas";
import { checkContent } from "@/lib/reviewValidation";
import { logContentFilterHit } from "@/lib/contentFilterLog";
import { checkRateLimit } from "@/lib/rateLimit";
import { isTradeMessagingEnabled } from "@/lib/features";
import { createNotification } from "@/lib/notification";
import { CLOSE_COOLDOWN_MS, livePairThreadWhere } from "@/lib/tradeThread";

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

  // "Görüşmeyi kapat" soğuma süresi — ilan sahibi bu kullanıcıyla bir görüşmeyi
  // son CLOSE_COOLDOWN_MS içinde kapattıysa, yeni görüşme başlatılamaz (çok-ilan
  // üzerinden sık boğaz etmeyi keser; kalıcı çözüm engelleme). Yön önemli:
  // yalnızca ilan sahibi kapattıysa geçerli.
  const recentClose = await prisma.messageThread.findFirst({
    where: {
      closedByUserId: listing.userId,
      closedAt: { gte: new Date(Date.now() - CLOSE_COOLDOWN_MS) },
      blockedByUserId: null,
      OR: [{ initiatorId: userId }, { tradeListing: { userId } }],
    },
    orderBy: { closedAt: "desc" },
    select: { closedAt: true },
  });
  if (recentClose?.closedAt) {
    const until = new Date(recentClose.closedAt.getTime() + CLOSE_COOLDOWN_MS);
    return NextResponse.json(
      {
        error: `Bu kullanıcı yakın zamanda bir görüşmeyi kapattı. ${until.toLocaleDateString("tr-TR", { day: "numeric", month: "long" })} tarihinden sonra yeni bir görüşme başlatabilirsiniz.`,
      },
      { status: 403 },
    );
  }

  // Çift arası zaten canlı bir görüşme varsa (herhangi bir ilanda, iki yönden
  // biriyle) yeni thread açtırma — mevcut görüşmeye yönlendir. Cooldown
  // kontrolünden SONRA: sahibin kapattığı görüşme yukarıda 403 verir, buraya
  // düşmez. Rate-limit'ten ÖNCE: yönlendirme token harcamamalı.
  const existingPair = await prisma.messageThread.findFirst({
    where: livePairThreadWhere(userId, listing.userId),
    orderBy: { lastMessageAt: "desc" },
    select: { id: true },
  });
  if (existingPair) {
    console.log("[trade-dedup] redirect", { userId, listingId, threadId: existingPair.id, phase: "pre" });
    return NextResponse.json(
      { error: "Bu ilan sahibiyle zaten bir görüşmeniz var.", threadId: existingPair.id },
      { status: 409 },
    );
  }

  const parsed = threadCreateSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 });
  }
  const { text } = parsed.data;
  const initiatorListingIdRaw = parsed.data.initiatorListingId;
  const initiatorListingId = initiatorListingIdRaw != null ? Number(initiatorListingIdRaw) : null;

  const contentCheck = checkContent(text, { strict: true });
  if (!contentCheck.ok) {
    logContentFilterHit({ userId, surface: "TRADE_THREAD", rule: contentCheck.rule });
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

  // Yarış: A ve B aynı anda birbirlerinin ilanına mesaj atarsa iki findFirst de
  // boş döner. Çift-anahtarlı advisory xact lock ile pair başına seri hale
  // getir, kilidin içinde tekrar kontrol et. PgBouncer transaction-mode ile
  // uyumlu (xact-scoped, commit'te otomatik serbest).
  let threadId: number;
  try {
    const lo = Math.min(userId, listing.userId);
    const hi = Math.max(userId, listing.userId);
    const outcome = await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT pg_advisory_xact_lock(${lo}::int, ${hi}::int)`;
      const again = await tx.messageThread.findFirst({
        where: livePairThreadWhere(userId, listing.userId),
        orderBy: { lastMessageAt: "desc" },
        select: { id: true },
      });
      if (again) return { kind: "existing" as const, id: again.id };
      const created = await tx.messageThread.create({
        data: {
          tradeListingId: listingId,
          initiatorId: userId,
          initiatorListingId,
          messages: { create: { senderId: userId, text } },
        },
        select: { id: true },
      });
      return { kind: "created" as const, id: created.id };
    });
    if (outcome.kind === "existing") {
      console.log("[trade-dedup] redirect", { userId, listingId, threadId: outcome.id, phase: "lock" });
      return NextResponse.json(
        { error: "Bu ilan sahibiyle zaten bir görüşmeniz var.", threadId: outcome.id },
        { status: 409 },
      );
    }
    threadId = outcome.id;
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      // Aynı ilana ikinci thread (tradeListingId_initiatorId unique) — mevcut
      // görüşmenin id'sini çözüp yönlendir.
      console.warn("[trade-dedup] p2002-race", { userId, listingId });
      const dup = await prisma.messageThread.findUnique({
        where: { tradeListingId_initiatorId: { tradeListingId: listingId, initiatorId: userId } },
        select: { id: true },
      });
      return NextResponse.json(
        { error: "Bu ilan sahibiyle zaten bir görüşmeniz var.", threadId: dup?.id },
        { status: 409 },
      );
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
