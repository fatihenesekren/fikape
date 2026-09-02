import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { tradeListingCreateSchema, formatZodError } from "@/lib/schemas";
import { checkRateLimit } from "@/lib/rateLimit";
import { isTradeListingEnabled } from "@/lib/features";
import { hashRequestContext } from "@/lib/security";
import { createNotification } from "@/lib/notification";
import { CAR_PARTS } from "@/lib/carParts";
import { isMutualMatch, fuelTransmissionFromAttributes, type WantCriteria, type VehicleFacts } from "@/lib/tradeMatching";
import type { LocationScope, TradeFuelType } from "@/lib/tradeExpectations";
import type { DamageStatus } from "@/lib/damageStatus";

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
  const {
    wantAnything, note, description, paymentIntent, city,
    damageStatus, engineCondition, engineNote,
    transmissionCondition, transmissionNote,
    runningGearCondition, runningGearNote, tramerRecords,
    wantLocationScope, wantDamageStatuses, usageAmount,
    wantYearMin, wantYearMax, wantKmMin, wantKmMax, wantFuelTypes, wantTransmissions,
  } = parsed.data;
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
      product: {
        select: {
          categoryId: true, brandId: true, year: true, attributes: true,
          brand: { select: { name: true } }, model: { select: { name: true } },
        },
      },
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
        ...(wantLocationScope !== undefined ? { wantLocationScope } : {}),
        ...(wantDamageStatuses !== undefined ? { wantDamageStatuses } : {}),
        wantYearMin: wantYearMin ?? null,
        wantYearMax: wantYearMax ?? null,
        wantKmMin: wantKmMin ?? null,
        wantKmMax: wantKmMax ?? null,
        ...(wantFuelTypes !== undefined ? { wantFuelTypes } : {}),
        ...(wantTransmissions !== undefined ? { wantTransmissions } : {}),
        note: note ?? null,
        description: description ?? null,
        paymentIntent,
        city,
        damageStatus: damageStatus ?? null,
        engineCondition: engineCondition ?? null,
        engineNote: engineNote ?? null,
        transmissionCondition: transmissionCondition ?? null,
        transmissionNote: transmissionNote ?? null,
        runningGearCondition: runningGearCondition ?? null,
        runningGearNote: runningGearNote ?? null,
      },
    });

    // Km — TradeListing'de değil, UserProduct'ta tutulan tek doğruluk kaynağı
    // (bkz. schemas.ts'teki usageAmountRange notu) — Takas formundan girilirse
    // buradan Garaj'a doğru yazılır, Garaj'dan girilirse zaten oradan yazılıyor.
    if (usageAmount !== undefined) {
      await prisma.userProduct.update({
        where: { id: userProductId },
        data: { usageAmount: usageAmount ?? null, usageUnit: usageAmount != null ? "km" : null },
      }).catch(() => {});
    }

    if (partConditionEntries.length > 0) {
      await prisma.tradeListingPartCondition.createMany({
        data: partConditionEntries.map(([partKey, condition]) => ({
          tradeListingId: listing.id,
          partKey,
          condition,
        })),
      });
    }

    if (tramerRecords && tramerRecords.length > 0) {
      await prisma.tradeTramerRecord.createMany({
        data: tramerRecords.map((r) => ({
          tradeListingId: listing.id,
          month: r.month,
          year: r.year,
          amount: r.amount,
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
    // diye (bkz. denetim raporu). Her alan NULL/boş ise "fark etmez" anlamına
    // gelir. Yıl/km: yeni ilanın o verisi yoksa (year/km null) o kriterde
    // dışlanmaz — aynı "bilinmeyen veriyi eleme" ilkesi (bkz. tradeMatching.ts).
    // Serbest metin (q) kasıtlı olarak burada YOK — SavedSearch'e hiç kaydedilmiyor.
    const { fuelType: newListingFuelType, transmission: newListingTransmission } =
      fuelTransmissionFromAttributes(userProduct.product.attributes);
    const newListingYear = userProduct.product.year;
    const newListingKm = usageAmount ?? null;
    const matchingSearches = await prisma.savedSearch.findMany({
      where: {
        city,
        userId: { not: userId },
        AND: [
          { OR: [{ categoryId: null }, { categoryId: userProduct.product.categoryId }] },
          { OR: [{ brandId: null }, { brandId: userProduct.product.brandId }] },
          { OR: [{ paymentIntent: null }, { paymentIntent }] },
          ...(newListingYear != null
            ? [
                { OR: [{ yearMin: null }, { yearMin: { lte: newListingYear } }] },
                { OR: [{ yearMax: null }, { yearMax: { gte: newListingYear } }] },
              ]
            : []),
          ...(newListingKm != null
            ? [
                { OR: [{ kmMin: null }, { kmMin: { lte: newListingKm } }] },
                { OR: [{ kmMax: null }, { kmMax: { gte: newListingKm } }] },
              ]
            : []),
          ...(newListingFuelType != null
            ? [{ OR: [{ fuelTypes: { isEmpty: true } }, { fuelTypes: { has: newListingFuelType as TradeFuelType } }] }]
            : []),
          ...(newListingTransmission != null
            ? [{ OR: [{ transmissions: { isEmpty: true } }, { transmissions: { has: newListingTransmission } }] }]
            : []),
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

    // Karşılıklı eşleşme bildirimi — yeni ilanın aracı bir başka aktif ilanın
    // aradığına, o ilanın aracı da yeni ilanın aradığına uyuyorsa iki tarafa
    // da bildirim gider (bkz. boşluk raporu, DÜŞÜK madde — Faz 2). DB seviyesinde
    // kategori/marka ile ön-filtreleniyor, konum/hasar kontrolü JS'te.
    const newVehicle: VehicleFacts = {
      categoryId: userProduct.product.categoryId,
      brandId: userProduct.product.brandId,
      city,
      damageStatus: damageStatus ?? null,
      year: userProduct.product.year,
      km: usageAmount ?? null,
      ...fuelTransmissionFromAttributes(userProduct.product.attributes),
    };
    const newWant: WantCriteria = {
      wantCategoryId,
      wantBrandId,
      wantLocationScope: (wantLocationScope ?? "NATIONWIDE") as LocationScope,
      wantDamageStatuses: (wantDamageStatuses ?? []) as DamageStatus[],
      city,
      wantYearMin: wantYearMin ?? null,
      wantYearMax: wantYearMax ?? null,
      wantKmMin: wantKmMin ?? null,
      wantKmMax: wantKmMax ?? null,
      wantFuelTypes: (wantFuelTypes ?? []) as WantCriteria["wantFuelTypes"],
      wantTransmissions: wantTransmissions ?? [],
    };
    const newVehicleName = `${userProduct.product.brand.name} ${userProduct.product.model.name}`;

    const candidates = await prisma.tradeListing.findMany({
      where: {
        isActive: true,
        userId: { not: userId },
        OR: [{ wantCategoryId: null }, { wantCategoryId: newVehicle.categoryId }],
        AND: [{ OR: [{ wantBrandId: null }, { wantBrandId: newVehicle.brandId }] }],
      },
      select: {
        id: true, userId: true, city: true, damageStatus: true,
        wantCategoryId: true, wantBrandId: true, wantLocationScope: true, wantDamageStatuses: true,
        wantYearMin: true, wantYearMax: true, wantKmMin: true, wantKmMax: true,
        wantFuelTypes: true, wantTransmissions: true,
        userProduct: { select: { usageAmount: true, usageUnit: true } },
        product: {
          select: {
            categoryId: true, brandId: true, year: true, attributes: true,
            brand: { select: { name: true } }, model: { select: { name: true } },
          },
        },
      },
    }).catch(() => []);

    for (const c of candidates) {
      const candidateVehicle: VehicleFacts = {
        categoryId: c.product.categoryId, brandId: c.product.brandId, city: c.city, damageStatus: c.damageStatus,
        year: c.product.year,
        km: c.userProduct?.usageUnit === "km" ? c.userProduct.usageAmount : null,
        ...fuelTransmissionFromAttributes(c.product.attributes),
      };
      const candidateWant: WantCriteria = {
        wantCategoryId: c.wantCategoryId, wantBrandId: c.wantBrandId,
        wantLocationScope: c.wantLocationScope as LocationScope,
        wantDamageStatuses: c.wantDamageStatuses as DamageStatus[],
        city: c.city,
        wantYearMin: c.wantYearMin, wantYearMax: c.wantYearMax,
        wantKmMin: c.wantKmMin, wantKmMax: c.wantKmMax,
        wantFuelTypes: c.wantFuelTypes as WantCriteria["wantFuelTypes"],
        wantTransmissions: c.wantTransmissions,
      };
      if (!isMutualMatch({ want: newWant, vehicle: newVehicle }, { want: candidateWant, vehicle: candidateVehicle })) continue;

      const candidateVehicleName = `${c.product.brand.name} ${c.product.model.name}`;
      createNotification({
        userId: c.userId,
        type: "TRADE_MUTUAL_MATCH",
        message: `"${newVehicleName}" ilanı, aradığın kriterlerle eşleşiyor ve senin aracın da onun aradığına uyuyor!`,
        link: `/takas/${listing.id}`,
      }).catch(() => {});
      createNotification({
        userId,
        type: "TRADE_MUTUAL_MATCH",
        message: `"${candidateVehicleName}" ilanı, aradığın kriterlerle eşleşiyor ve senin aracın da onun aradığına uyuyor!`,
        link: `/takas/${c.id}`,
      }).catch(() => {});
    }

    return NextResponse.json({ ok: true, id: listing.id }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Bu araç için zaten aktif bir takas ilanınız var." }, { status: 409 });
  }
}
