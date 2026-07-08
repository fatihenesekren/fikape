import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { BASE_URL } from "@/lib/baseUrl";
import { JsonLd } from "@/components/JsonLd";
import { calcShrunkScore, MIN_TOTAL_REVIEWS_FOR_INDEX } from "@/lib/brandIndex";
import { stripModelGenRange } from "@/lib/modelDisplay";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const brand = await prisma.brand.findUnique({ where: { slug }, select: { name: true } });
  if (!brand) return {};

  return {
    title: `${brand.name} Marka Endeksi`,
    description: `${brand.name} markasının fikape kullanıcı yorumlarına dayalı kategori bazlı güven endeksi — en iyi ve en düşük puanlı modeller.`,
  };
}

interface CategoryIndex {
  categorySlug: string;
  categoryName: string;
  totalReviews: number;
  endeks: number | null;
  bestProduct: { slug: string; name: string; avgScore: number; reviewCount: number } | null;
  worstProduct: { slug: string; name: string; avgScore: number; reviewCount: number } | null;
}

export default async function BrandIndexPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const brand = await prisma.brand.findUnique({ where: { slug } });
  if (!brand) notFound();

  const brandProducts = await prisma.product.findMany({
    where: { brandId: brand.id, isActive: true },
    select: {
      id: true,
      slug: true,
      name: true,
      year: true,
      categoryId: true,
      category: { select: { slug: true, name: true } },
      model: { select: { name: true } },
    },
  });

  const brandProductIds = brandProducts.map((p) => p.id);
  const brandReviews = brandProductIds.length
    ? await prisma.review.findMany({
        where: { productId: { in: brandProductIds }, status: "PUBLISHED" },
        select: { productId: true, scoreOverall: true },
      })
    : [];

  const categoryIds = [...new Set(brandProducts.map((p) => p.categoryId))];
  const categoryAvgs = new Map<number, number>();
  for (const categoryId of categoryIds) {
    const agg = await prisma.review.aggregate({
      where: { status: "PUBLISHED", product: { categoryId } },
      _avg: { scoreOverall: true },
    });
    categoryAvgs.set(categoryId, agg._avg.scoreOverall ?? 0);
  }

  const reviewsByProduct = new Map<number, number[]>();
  for (const r of brandReviews) {
    const list = reviewsByProduct.get(r.productId) ?? [];
    list.push(r.scoreOverall);
    reviewsByProduct.set(r.productId, list);
  }

  const categories: CategoryIndex[] = categoryIds.map((categoryId) => {
    const categoryProducts = brandProducts.filter((p) => p.categoryId === categoryId);
    const categoryReviewScores = categoryProducts.flatMap((p) => reviewsByProduct.get(p.id) ?? []);
    const totalReviews = categoryReviewScores.length;
    const rawAvg = totalReviews > 0 ? categoryReviewScores.reduce((s, n) => s + n, 0) / totalReviews : 0;
    const categoryAvg = categoryAvgs.get(categoryId) ?? 0;
    const endeks =
      totalReviews >= MIN_TOTAL_REVIEWS_FOR_INDEX
        ? Math.round(calcShrunkScore({ reviewCount: totalReviews, rawAvg, categoryAvg }) * 10) / 10
        : null;

    const productScores = categoryProducts
      .map((p) => {
        const scores = reviewsByProduct.get(p.id) ?? [];
        if (scores.length === 0) return null;
        return {
          slug: p.slug,
          name: `${stripModelGenRange(p.model.name)}${p.year ? ` ${p.year}` : ""}`,
          avgScore: Math.round((scores.reduce((s, n) => s + n, 0) / scores.length) * 10) / 10,
          reviewCount: scores.length,
        };
      })
      .filter((p): p is NonNullable<typeof p> => p !== null)
      .sort((a, b) => b.avgScore - a.avgScore);

    return {
      categorySlug: categoryProducts[0].category.slug,
      categoryName: categoryProducts[0].category.name,
      totalReviews,
      endeks,
      bestProduct: productScores[0] ?? null,
      worstProduct: productScores.length > 1 ? productScores[productScores.length - 1] : null,
    };
  });

  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${brand.name} — fikape kategori sıralaması`,
    itemListElement: categories.flatMap((c, categoryIndex) => {
      const categoryProducts = brandProducts.filter((p) => p.category.slug === c.categorySlug);
      const ranked = categoryProducts
        .map((p) => ({ p, scores: reviewsByProduct.get(p.id) ?? [] }))
        .filter(({ scores }) => scores.length > 0)
        .sort((a, b) => (b.scores.reduce((s, n) => s + n, 0) / b.scores.length) - (a.scores.reduce((s, n) => s + n, 0) / a.scores.length));
      return ranked.map(({ p }, i) => ({
        "@type": "ListItem",
        position: categoryIndex * 1000 + i + 1,
        url: `${BASE_URL}/araclar/${p.slug}`,
        name: `${brand.name} ${stripModelGenRange(p.model.name)}${p.year ? ` ${p.year}` : ""}`,
      }));
    }),
  };

  return (
    <>
      {itemListSchema.itemListElement.length > 0 && <JsonLd data={itemListSchema} />}

      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="mb-8">
          <Link href="/" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
            ← Ana sayfaya dön
          </Link>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">{brand.name} Marka Endeksi</h1>
        <p className="text-sm text-gray-400 mb-10">
          fikape kullanıcı yorumlarına dayalı, kategori bazlı güven endeksi.
        </p>

        <div className="space-y-6">
          {categories.map((c) => (
            <div key={c.categorySlug} className="bg-white border border-gray-100 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold text-gray-900">{c.categoryName}</h2>
                {c.endeks !== null ? (
                  <span className="text-2xl font-black text-gray-900">{c.endeks}<span className="text-sm text-gray-400 font-normal">/10</span></span>
                ) : (
                  <span className="text-xs text-gray-400">Veri birikiyor</span>
                )}
              </div>

              {c.endeks === null ? (
                <p className="text-sm text-gray-500">
                  Yeterli veri birikince gösterilecek ({c.totalReviews}/{MIN_TOTAL_REVIEWS_FOR_INDEX} yorum).
                </p>
              ) : (
                <div className="text-sm text-gray-500 space-y-1.5">
                  <p>{c.totalReviews} kullanıcı yorumuna dayanıyor.</p>
                  {c.bestProduct && (
                    <p>
                      🥇 En iyi:{" "}
                      <Link href={`/araclar/${c.bestProduct.slug}`} className="text-gray-900 font-semibold hover:underline">
                        {c.bestProduct.name}
                      </Link>{" "}
                      ({c.bestProduct.avgScore}/10)
                    </p>
                  )}
                  {c.worstProduct && (
                    <p>
                      🔻 En düşük:{" "}
                      <Link href={`/araclar/${c.worstProduct.slug}`} className="text-gray-900 font-semibold hover:underline">
                        {c.worstProduct.name}
                      </Link>{" "}
                      ({c.worstProduct.avgScore}/10)
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
