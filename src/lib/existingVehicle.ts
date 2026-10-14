import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slugify";
import { stripModelGenRange, baseNameplate, markasizModelAdi } from "@/lib/modelDisplay";

export { birebirAyniArac } from "@/lib/aracKarsilastir";

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

// Model adının yazım farklarından arınmış karşılaştırma anahtarı: nesil aralığı ve marka öneki atılır,
// boşluk/tire/işaret yok sayılır ("Mt 07" ve "MT-07" -> "mt07"; "SR/S (2020-)" -> "srs").
function modelAdiAnahtari(marka: string, ad: string): string {
  return slugify(stripModelGenRange(markasizModelAdi(marka, ad))).replace(/-/g, "");
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
  // Transaction içinde (admin ekleme: kopya kontrolü ile create aynı kilit altında) çağrılabilsin
  db: Pick<typeof prisma, "product"> = prisma,
): Promise<ExistingVehicleMatch[]> {
  const b = brandName?.trim();
  const m = modelName?.trim();
  if (!b || !m) return [];

  // Katalogda marka önekli ad ("Jaecoo 7") DB'de öneksiz ("7") tutulur; iki biçim de denenir.
  const modelAdlari = [...new Set([m, markasizModelAdi(b, m)])];
  const slugCandidates = [
    ...new Set(
      modelAdlari
        .flatMap((ad) => [
          slugify(`${b}-${ad}`),
          slugify(`${b}-${stripModelGenRange(ad)}`),
          slugify(`${b}-${baseNameplate(ad)}`),
        ])
        .filter(Boolean),
    ),
  ];
  if (slugCandidates.length === 0) return [];

  // Yazım farkı toleransı ("Mt 07" / "mt07", "X-Max 250" / "xmax-250", "SR/S"): slug'a ek olarak aynı
  // markanın ürünleri model adı anahtarıyla (boşluk/tire/işaretsiz) karşılaştırılır.
  const modelAnahtari = new Set(modelAdlari.map((ad) => modelAdiAnahtari(b, ad)).filter(Boolean));

  const adaylar = await db.product.findMany({
    where: {
      status: "ACTIVE",
      OR: [
        { model: { slug: { in: slugCandidates } } },
        { brand: { name: { equals: b, mode: "insensitive" } } },
      ],
      ...(categorySlug ? { category: { slug: categorySlug } } : {}),
    },
    select: {
      model: { select: { slug: true, name: true } },
      slug: true,
      name: true,
      year: true,
      trimName: true,
      attributes: true,
      _count: { select: { reviews: { where: { status: "PUBLISHED" } } } },
    },
  });

  const products = adaylar.filter(
    (p) => slugCandidates.includes(p.model.slug) || modelAnahtari.has(modelAdiAnahtari(b, p.model.name)),
  );

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
