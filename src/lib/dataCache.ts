import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";

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
