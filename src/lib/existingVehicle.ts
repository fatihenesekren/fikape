import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slugify";
import { stripModelGenRange, baseNameplate } from "@/lib/modelDisplay";

export interface ExistingVehicleMatch {
  slug: string;
  name: string;
  year: number | null;
  trimName: string | null;
  transmission: string | null;
  /** GASOLINE/DIESEL/EV/... — attributes.fuel_type; formda kullanıcının seçimiyle karşılaştırmak için. */
  fuelType: string | null;
  reviewCount: number;
}

/**
 * Yeni bir araç önerisinin (yıl, donanım, yakıt, vites) dörtlüsü mevcut bir
 * eşleşmeyle BİREBİR aynı mı? — gerçek kopya olarak engellemek için tek kanıt
 * bu: client'tan gelen bir "onaylıyorum" bayrağına ASLA güvenilmez, çünkü
 * böyle bir tasarım denenmiş ve marka+model eşleştiği an her gönderiyi
 * (birebir kopyalar dahil) atlatmıştı (bkz. kullanıcı geri bildirimi,
 * 2026-09-27). Dörtlüden herhangi biri farklıysa (ör. farklı yıl/donanım)
 * gerçekten farklı bir varyanttır — eksik/null bir alan da "aynı olduğundan
 * emin değiliz" sayılır, kopya SAYILMAZ (yanlış-pozitif engellemektense
 * yanlış-negatifi tercih ederiz, moderatör panelindeki "olası kopya" rozeti
 * zaten ikinci bir güvenlik ağı).
 */
export function birebirAyniArac(
  mevcut: Pick<ExistingVehicleMatch, "year" | "trimName" | "transmission" | "fuelType">,
  yeni: { year: number | null; trimName: string | null; transmission: string | null; fuelType: string | null },
): boolean {
  const mevcutTrim = (mevcut.trimName ?? "").trim().toLowerCase();
  const yeniTrim = (yeni.trimName ?? "").trim().toLowerCase();
  const mevcutVites = mevcut.transmission ? slugify(mevcut.transmission) : null;
  const yeniVites = yeni.transmission ? slugify(yeni.transmission) : null;
  return (
    mevcut.year !== null && yeni.year !== null && mevcut.year === yeni.year &&
    mevcutTrim !== "" && mevcutTrim === yeniTrim &&
    mevcut.fuelType !== null && mevcut.fuelType === yeni.fuelType &&
    mevcutVites !== null && mevcutVites === yeniVites
  );
}

// Katalogda (ACTIVE Product) bu marka+model zaten var mı?
//
// Eşleşme anahtarı: Product'ın model.slug'ı. Üç aday slug denenir çünkü mevcut
// katalog KARIŞIK:
//   - eski seed kayıtları modeli nesilsiz slug'lamış: "renault-clio"
//   - /api/oneriler ile eklenenler nesil aralığıyla: "renault-clio-4-2012-2019"
// Adaylar (öner formundaki "Clio 4 (2012-2019)" seçimi için):
//   1. tam ad     -> renault-clio-4-2012-2019
//   2. aralıksız  -> renault-clio-4
//   3. bare ad    -> renault-clio
// #3 yalnızca numarasız/nesilsiz tutulan bir kayda denk gelir (seed'in yaptığı) —
// o kayıt zaten nesilden bağımsız, eşleşmesi doğru. Farklı nesil kardeşler kendi
// numaralarını slug'da taşıdığı için (#3'e) çarpışmaz.
//
// Bilinen sınırlılık: baseNameplate "Ioniq 5" -> "Ioniq" gibi sayının adın
// PARÇASI olduğu modellerde de sayıyı atar. Bu yalnızca katalogda "Ioniq" adıyla
// (numarasız) ayrı bir kayıt varsa yanlış-pozitif üretir — fikape kataloğunda
// bu durum yok. Olursa: /oner istemcisinde kart yumuşak bir uyarı (kullanıcı
// "yine de öner" diyebilir), sunucu 409'unda ise geçici engel olur.
//
// Yıl/donanıma bakılmaz — "bu araç fikape'de mevcut mu?" sorusu bunlardan
// bağımsız; farklı yıl/donanım yeni Product değil, mevcut araca yorum yazma
// sebebidir.
//
// Not: eski birebir-slug kontrolü (slugify(marka-model-donanım-yıl)) çoğu zaman
// tutmuyordu (kullanıcı farklı yıl/donanım seçince) ve sessizce PENDING kopya
// üretiliyordu — bu fonksiyon onun yerini alıyor.
export async function findExistingVehicles(
  brandName: string,
  modelName: string,
  categorySlug?: string,
): Promise<ExistingVehicleMatch[]> {
  const b = brandName?.trim();
  const m = modelName?.trim();
  if (!b || !m) return [];

  const slugCandidates = [
    ...new Set(
      [
        slugify(`${b}-${m}`),
        slugify(`${b}-${stripModelGenRange(m)}`),
        slugify(`${b}-${baseNameplate(m)}`),
      ].filter(Boolean),
    ),
  ];
  if (slugCandidates.length === 0) return [];

  const products = await prisma.product.findMany({
    where: {
      status: "ACTIVE",
      model: { slug: { in: slugCandidates } },
      ...(categorySlug ? { category: { slug: categorySlug } } : {}),
    },
    select: {
      slug: true,
      name: true,
      year: true,
      trimName: true,
      attributes: true,
      _count: { select: { reviews: { where: { status: "PUBLISHED" } } } },
    },
  });

  return products
    .map((p) => ({
      slug: p.slug,
      name: p.name,
      year: p.year,
      trimName: p.trimName,
      transmission:
        ((p.attributes as Record<string, unknown> | null)?.transmission as string | undefined) ?? null,
      fuelType: ((p.attributes as Record<string, unknown> | null)?.fuel_type as string | undefined) ?? null,
      reviewCount: p._count.reviews,
    }))
    .sort(
      (x, y) => y.reviewCount - x.reviewCount || (y.year ?? 0) - (x.year ?? 0),
    );
}
