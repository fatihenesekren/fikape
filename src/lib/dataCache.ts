import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { formatCompareVehicleName } from "@/lib/compare/formatCompareVehicleName";

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
      .filter(Boolean) as Array<{
        slug: string;
        name: string;
        categorySlug: string;
        categoryName: string;
        reviewCount: number;
      }>;
  },
  ["compare-most-reviewed"],
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
