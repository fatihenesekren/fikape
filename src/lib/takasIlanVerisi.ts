import { prisma } from "@/lib/prisma";
import type { PartCondition } from "@/lib/carParts";
import { getTakasFiltreSecenekleri } from "@/lib/takasFiltre";

// TradeToggleCard (ilan açma/düzenleme/kapatma/yenileme kartı) için gereken veri — Garajım'da araç kartının
// içinde, Takas Panelim'de "İlanlarım" bölümünde AYNI kart kullanılır; veri de tek yerden yüklenir
// (önceden Garajım sayfasının içinde gömülüydü).
//
// Sadece aktif değil, en son (kapalı dahil) ilan da çekilir — kapalı bir ilanı "yeniden aç" seçeneği
// sunabilmek için (bkz. denetim raporu Faz 2).
export async function takasIlanFormVerisi(userId: number) {
  // Katalog kısmı (kategori, marka, hangi kategoride hangi marka) önbellekten; yalnız kullanıcının ilanları canlı.
  const [tradeListings, secenekler] = await Promise.all([
    prisma.tradeListing.findMany({
      where: { userId },
      select: {
        id: true, userProductId: true, isActive: true, city: true,
        paymentIntent: true, note: true, description: true, wantAnything: true,
        wantCategoryId: true, wantBrandId: true,
        wantLocationScope: true, wantDamageStatuses: true,
        wantYearMin: true, wantYearMax: true, wantKmMin: true, wantKmMax: true,
        wantFuelTypes: true, wantTransmissions: true,
        partConditions: { select: { partKey: true, condition: true } },
        damageStatus: true, damageStatusNote: true,
        engineCondition: true, engineNote: true,
        transmissionCondition: true, transmissionNote: true,
        runningGearCondition: true, runningGearNote: true,
        tramerRecords: { select: { month: true, year: true, amount: true }, orderBy: [{ year: "desc" }, { month: "desc" }] },
        photos: {
          where: { status: { not: "REJECTED" } },
          select: { id: true, url: true, status: true },
          orderBy: [{ order: "asc" }, { createdAt: "asc" }],
        },
      },
      orderBy: { createdAt: "desc" },
    }).catch(() => []),
    // Sadece yaprak kategoriler (üst kategori "Araçlar" hariç) — bkz. lib/takasFiltre.ts
    getTakasFiltreSecenekleri().catch(() => ({
      categories: [] as { id: number; slug: string; name: string }[],
      brands: [] as { id: number; slug: string; name: string }[],
      categoryBrandIdMap: {} as Record<number, number[]>,
    })),
  ]);
  const { categories, brands, categoryBrandIdMap: categoryBrandMap } = secenekler;

  // tradeListings createdAt desc sıralı — her userProductId için İLK karşılaşılan (yani en yeni) kayıt
  // tutulmalı; new Map(array) tam tersini yapıp SON kaydı tutar, bu yüzden manuel olarak sadece henüz
  // map'te olmayan anahtarlar ekleniyor.
  const listingByUserProductId = new Map<number, Omit<(typeof tradeListings)[number], "partConditions"> & { partConditions: Record<string, PartCondition> }>();
  for (const t of tradeListings) {
    if (!listingByUserProductId.has(t.userProductId)) {
      const { partConditions: rawPartConditions, ...rest } = t;
      const partConditionsMap: Record<string, PartCondition> = Object.fromEntries(
        rawPartConditions.map((p) => [p.partKey, p.condition as PartCondition])
      );
      listingByUserProductId.set(t.userProductId, { ...rest, partConditions: partConditionsMap });
    }
  }
  return { categories, brands, categoryBrandMap, listingByUserProductId };
}
