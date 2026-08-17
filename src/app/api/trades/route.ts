import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { tradeListingCreateSchema, formatZodError } from "@/lib/schemas";
import { checkRateLimit } from "@/lib/rateLimit";
import { isTradeListingEnabled } from "@/lib/features";
import { hashRequestContext } from "@/lib/security";
import { createNotification } from "@/lib/notification";
import { CAR_PARTS } from "@/lib/carParts";

const DAILY_LISTING_LIMIT = Number(process.env.TAKASA_AC_ILAN_GUNLUK_LIMIT) || 5;

export async function POST(req: Request) {
  if (!isTradeListingEnabled()) {
    return NextResponse.json({ error: "Bu özellik geçici olarak kapalı." }, { status: 503 });
  }

  const session = await auth();
  if (!session) return NextResponse.json({ error: "Giriş gerekli." }, { status: 401 });

  const userId = Number(session.user.id);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isBanned: true },
  });
  if (!user || user.isBanned) {
    return NextResponse.json({ error: "Bu işlemi gerçekleştiremezsiniz." }, { status: 403 });
  }

  const parsed = tradeListingCreateSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 });
  }
  const { wantAnything, note, description, paymentIntent, city } = parsed.data;
  const userProductId = Number(parsed.data.userProductId);
  const wantCategoryId = parsed.data.wantCategoryId != null ? Number(parsed.data.wantCategoryId) : null;
  const wantBrandId = parsed.data.wantBrandId != null ? Number(parsed.data.wantBrandId) : null;

  // Sadece bilinen parça anahtarları kabul edilir (whitelist) — istemciden
  // gelen serbest string'lerin doğrudan DB'ye yazılmasını önler.
  const validPartKeys = new Set(CAR_PARTS.map((p) => p.key));
  const partConditionEntries = Object.entries(parsed.data.partConditions ?? {}).filter(
    ([key]) => validPartKeys.has(key)
  );

  const userProduct = await prisma.userProduct.findUnique({
    where: { id: userProductId },
    select: {
      id: true, userId: true, productId: true, ownershipStatus: true,
      product: { select: { categoryId: true, brandId: true } },
    },
  });
  if (!userProduct || userProduct.userId !== userId || userProduct.ownershipStatus !== "CURRENT") {
    return NextResponse.json({ error: "Bu araç garajınızda değil." }, { status: 404 });
  }

  // trustLevel genel/kullanıcı-bazlı olduğu için (başka bir araç için yükselmiş olabilir),
  // bu ARACA özgü fotoğraflı+onaylı bir yorum var mı diye kontrol edilir.
  const verifiedReview = await prisma.review.findFirst({
    where: { userProductId, status: "PUBLISHED", photos: { some: { status: "APPROVED" } } },
    select: { id: true },
  });
  if (!verifiedReview) {
    return NextResponse.json(
      { error: "Takasa açmak için bu aracın fotoğraflı, onaylanmış bir yorumu olması gerekiyor." },
      { status: 403 }
    );
  }

  const existing = await prisma.tradeListing.findFirst({
    where: { userProductId, isActive: true },
  });
  if (existing) {
    return NextResponse.json({ error: "Bu araç için zaten aktif bir takas ilanınız var." }, { status: 409 });
  }

  if (!(await checkRateLimit(`trade-create:${userId}`, DAILY_LISTING_LIMIT, 24 * 60 * 60 * 1000))) {
    return NextResponse.json({ error: "Günlük ilan açma sınırına ulaştınız, yarın tekrar deneyiniz." }, { status: 429 });
  }

  try {
    const listing = await prisma.tradeListing.create({
      data: {
        userId,
        productId: userProduct.productId,
        userProductId,
        wantCategoryId,
        wantBrandId,
        wantAnything: wantAnything ?? false,
        note: note ?? null,
        description: description ?? null,
        paymentIntent,
        city,
      },
    });

    if (partConditionEntries.length > 0) {
      await prisma.tradeListingPartCondition.createMany({
        data: partConditionEntries.map(([partKey, condition]) => ({
          tradeListingId: listing.id,
          partKey,
          condition,
        })),
      });
    }

    // KVKK açık rıza kaydı — schema zaten ham IP/UA yerine hash saklama ilkesini
    // kullanıyor (bkz. security.ts), ConsentLog alan adları "ipAddress/userAgent"
    // olsa da buraya kasıtlı olarak hash yazılıyor.
    const { ipHash, userAgentHash } = hashRequestContext(req);
    await prisma.consentLog.create({
      data: {
        userId,
        consentType: "TRADE_LISTING",
        isGranted: true,
        ipAddress: ipHash,
        userAgent: userAgentHash,
      },
    }).catch(() => {});

    // Kayıtlı arama eşleşme bildirimi — kullanıcı pasif taramak zorunda kalmasın
    // diye (bkz. denetim raporu). categoryId/brandId NULL olan kayıtlı aramalar
    // "fark etmez" anlamına geliyor, o alan için her zaman eşleşir.
    const matchingSearches = await prisma.savedSearch.findMany({
      where: {
        city,
        userId: { not: userId },
        AND: [
          { OR: [{ categoryId: null }, { categoryId: userProduct.product.categoryId }] },
          { OR: [{ brandId: null }, { brandId: userProduct.product.brandId }] },
        ],
      },
      select: { userId: true },
    });
    for (const s of matchingSearches) {
      createNotification({
        userId: s.userId,
        type: "SAVED_SEARCH_MATCH",
        message: `${city} ilinde kayıtlı aramanızla eşleşen yeni bir takas ilanı var`,
        link: `/takas/${listing.id}`,
      }).catch(() => {});
    }

    return NextResponse.json({ ok: true, id: listing.id }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Bu araç için zaten aktif bir takas ilanınız var." }, { status: 409 });
  }
}
