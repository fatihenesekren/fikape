import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { formatCompareVehicleName } from "@/lib/compare/formatCompareVehicleName";

export interface CompareSuggestion {
  slug: string;
  name: string;
  categorySlug: string;
  categoryName: string;
  reviewCount: number;
}

// /karsilastir'in boş seçici sayfasında, kullanıcı henüz araç seçmemişken
// "Popüler" öneri etiketleri için — getTopRatedProducts'tan farklı olarak
// puana göre değil, YORUM SAYISINA göre sıralıyor (en çok konuşulan araçlar).
export const getMostReviewedProducts = unstable_cache(
  async () => {
    const topAgg = await prisma.review.groupBy({
      by: ["productId"],
      where: { status: "PUBLISHED" },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 3,
    });

    if (!topAgg.length) return [];

    const products = await prisma.product.findMany({
      where: { id: { in: topAgg.map((a) => a.productId) } },
      include: { brand: true, model: true, category: true },
    });

    return topAgg
      .map((a) => {
        const p = products.find((pr) => pr.id === a.productId);
        if (!p) return null;
        const { fullLabel } = formatCompareVehicleName(p.model.name, p.trimName ?? null);
        return {
          slug: p.slug,
          name: `${p.brand.name} ${fullLabel}${p.year ? ` ${p.year}` : ""}`,
          categorySlug: p.category.slug,
          categoryName: p.category.name,
          reviewCount: a._count.id,
        };
      })
      .filter(Boolean) as CompareSuggestion[];
  },
  ["compare-most-reviewed"],
  { revalidate: 3600 }
);

// İlk araç seçilip kategori kilitlenince /karsilastir'deki öneri şeridi bu
// kategoriye güncellensin diye (bkz. kullanıcı geri bildirimi: global top-3
// farklı kategoriden çıkabiliyordu, kategori kilidi tarafından sessizce
// düşürülüyordu). `categorySlug`'a göre PARAMETRELİ — Next.js'in
// unstable_cache'i çağrı argümanlarını cache key'e otomatik dahil ediyor,
// her kategori kendi cache girdisini alıyor.
//
// ÖNEMLİ: yorumu OLMAYAN ürünler de aday havuzuna dahil (bkz. kullanıcı geri
// bildirimi: "yorum olup olmamasına bakmadan aynı kategoriden öneri
// gösterelim") — sadece yorumlu ürünlere bakan önceki sürüm, az yorumlu dar
// kategorilerde (örn. "E-Bisiklet"de tek yorumlu ürün zaten seçiliyken) sıfır
// aday kalmasına yol açıyordu. Kategorideki TÜM aktif ürünler çekilip yorum
// sayısına göre sıralanıyor (yorumu olanlar önce, eşitlikte/yorumsuzlarda
// viewCount tiebreak) — liste hiç boş kalmıyor, sadece en az yorumluya doğru
// kayıyor. take:8 bir tampon: route handler (src/app/api/compare/suggestions)
// seçili araçları hariç tutup ilk 3'ü döndürüyor, bu yüzden 3'ten fazla
// adayla gelmek gerekiyor.
export const getMostReviewedByCategory = unstable_cache(
  async (categorySlug: string): Promise<CompareSuggestion[]> => {
    const category = await prisma.category.findUnique({ where: { slug: categorySlug } });
    if (!category) return [];

    const [reviewAgg, products] = await Promise.all([
      prisma.review.groupBy({
        by: ["productId"],
        where: { status: "PUBLISHED", product: { categoryId: category.id } },
        _count: { id: true },
      }),
      prisma.product.findMany({
        where: { categoryId: category.id, isActive: true },
        include: { brand: true, model: true, category: true },
        orderBy: { viewCount: "desc" },
        take: 30,
      }),
    ]);

    if (!products.length) return [];

    const reviewCountMap = new Map(reviewAgg.map((a) => [a.productId, a._count.id]));

    // Array.prototype.sort STABIL — reviewCount eşitliğinde (örn. hepsi 0)
    // ürünlerin `viewCount desc` sıralaması (findMany'den gelen) korunuyor.
    return products
      .map((p) => ({ p, reviewCount: reviewCountMap.get(p.id) ?? 0 }))
      .sort((a, b) => b.reviewCount - a.reviewCount)
      .slice(0, 8)
      .map(({ p, reviewCount }) => {
        const { fullLabel } = formatCompareVehicleName(p.model.name, p.trimName ?? null);
        return {
          slug: p.slug,
          name: `${p.brand.name} ${fullLabel}${p.year ? ` ${p.year}` : ""}`,
          categorySlug: p.category.slug,
          categoryName: p.category.name,
          reviewCount,
        };
      });
  },
  ["compare-most-reviewed-by-category"],
  { revalidate: 3600 }
);

export const getTopRatedProducts = unstable_cache(
  async () => {
    const topAgg = await prisma.review.groupBy({
      by: ["productId"],
      where: { status: "PUBLISHED" },
      _avg: {
        scoreOverall: true,
        scoreFiyat: true,
        scoreKalite: true,
        scorePerformans: true,
      },
      _count: { id: true },
      orderBy: { _avg: { scoreOverall: "desc" } },
      take: 3,
    });

    if (!topAgg.length) return [];

    const products = await prisma.product.findMany({
      where: { id: { in: topAgg.map((a) => a.productId) } },
      include: { brand: true, model: true },
    });

    return topAgg
      .filter((a) => a._avg.scoreOverall)
      .map((a) => {
        const p = products.find((pr) => pr.id === a.productId);
        if (!p) return null;
        return {
          slug: p.slug,
          brandName: p.brand.name,
          modelName: p.model.name,
          trimName: p.trimName ?? null,
          imageUrl: p.imageUrl ?? null,
          year: p.year ?? null,
          reviewCount: a._count.id,
          scores: {
            scoreFiyat: a._avg.scoreFiyat ?? 0,
            scoreKalite: a._avg.scoreKalite ?? 0,
            scorePerformans: a._avg.scorePerformans ?? 0,
            scoreOverall: a._avg.scoreOverall ?? 0,
          },
        };
      })
      .filter(Boolean) as Array<{
        slug: string;
        brandName: string;
        modelName: string;
        trimName: string | null;
        imageUrl: string | null;
        year: number | null;
        reviewCount: number;
        scores: {
          scoreFiyat: number;
          scoreKalite: number;
          scorePerformans: number;
          scoreOverall: number;
        };
      }>;
  },
  ["hero-top-rated"],
  { revalidate: 3600 }
);
