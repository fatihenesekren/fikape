import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";

export const getHeroStats = unstable_cache(
  async () => {
    const [totalModels, totalReviews] = await Promise.all([
      prisma.model.count({ where: { products: { some: { isActive: true } } } }),
      prisma.review.count({ where: { status: "PUBLISHED" } }),
    ]);
    return { totalModels, totalReviews };
  },
  ["hero-stats"],
  { revalidate: 3600 }
);

export const getTopRatedProduct = unstable_cache(
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
      take: 1,
    });

    if (!topAgg.length || !topAgg[0]._avg.scoreOverall) return null;

    const product = await prisma.product.findUnique({
      where: { id: topAgg[0].productId },
      include: { brand: true, model: true },
    });
    if (!product) return null;

    return {
      slug: product.slug,
      brandName: product.brand.name,
      modelName: product.model.name,
      imageUrl: product.imageUrl ?? null,
      year: product.year ?? null,
      reviewCount: topAgg[0]._count.id,
      scores: {
        scoreFiyat: topAgg[0]._avg.scoreFiyat ?? 0,
        scoreKalite: topAgg[0]._avg.scoreKalite ?? 0,
        scorePerformans: topAgg[0]._avg.scorePerformans ?? 0,
        scoreOverall: topAgg[0]._avg.scoreOverall ?? 0,
      },
    };
  },
  ["hero-top-rated"],
  { revalidate: 3600 }
);
