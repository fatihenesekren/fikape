import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { VehicleCard } from "@/components/VehicleCard";
import { getVehicleImageUrls } from "@/lib/vehicleImages";
import type { FikapeScores } from "@/lib/fikape";
import Link from "next/link";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}): Promise<Metadata> {
  const { q } = await searchParams;
  return {
    title: q ? `"${q}" için arama sonuçları` : "Araç Ara",
    robots: { index: false },
  };
}

export default async function AramaPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";

  const products = query.length >= 2
    ? await prisma.product.findMany({
        where: {
          isActive: true,
          OR: [
            { name:     { contains: query, mode: "insensitive" } },
            { trimName: { contains: query, mode: "insensitive" } },
            { brand:    { name: { contains: query, mode: "insensitive" } } },
            { model:    { name: { contains: query, mode: "insensitive" } } },
          ],
        },
        include: {
          brand: true,
          model: true,
          category: true,
          _count: { select: { reviews: { where: { status: "PUBLISHED" } } } },
        },
        orderBy: [{ brand: { name: "asc" } }, { year: "desc" }],
      })
    : [];

  // Puan ortalamaları
  const productIds = products.map((p) => p.id);
  const scoreAggs = productIds.length
    ? await prisma.review.groupBy({
        by: ["productId"],
        where: { status: "PUBLISHED", productId: { in: productIds } },
        _avg: {
          scoreFiyat: true, scoreKalite: true,
          scorePerformans: true, scoreOverall: true,
        },
        _count: { id: true },
      })
    : [];

  const scoreMap = new Map(
    scoreAggs.map((a) => [
      a.productId,
      {
        scores: {
          scoreFiyat:      a._avg.scoreFiyat      ?? 0,
          scoreKalite:     a._avg.scoreKalite     ?? 0,
          scorePerformans: a._avg.scorePerformans ?? 0,
          scoreOverall:    a._avg.scoreOverall    ?? 0,
        } as FikapeScores,
        count: a._count.id,
      },
    ])
  );

  // Model bazında grupla (ana sayfayla aynı mantık)
  type Product = (typeof products)[number];
  const modelGroups = new Map<number, Product[]>();
  for (const p of products) {
    const group = modelGroups.get(p.modelId) ?? [];
    group.push(p);
    modelGroups.set(p.modelId, group);
  }

  const modelCards = Array.from(modelGroups.values()).map((variants) => {
    const sorted  = [...variants].sort((a, b) => (b.year ?? 0) - (a.year ?? 0));
    const primary = sorted[0];

    let totalReviews = 0, wFiyat = 0, wKalite = 0, wPerformans = 0, wOverall = 0;
    for (const v of variants) {
      const entry = scoreMap.get(v.id);
      if (entry && entry.count > 0) {
        totalReviews += entry.count;
        wFiyat       += entry.scores.scoreFiyat      * entry.count;
        wKalite      += entry.scores.scoreKalite     * entry.count;
        wPerformans  += entry.scores.scorePerformans * entry.count;
        wOverall     += (entry.scores.scoreOverall ?? 0) * entry.count;
      }
    }

    const modelScores: FikapeScores | null = totalReviews > 0
      ? { scoreFiyat: wFiyat / totalReviews, scoreKalite: wKalite / totalReviews,
          scorePerformans: wPerformans / totalReviews, scoreOverall: wOverall / totalReviews }
      : null;

    const dbImageUrl = sorted.find((v) => v.imageUrl)?.imageUrl ?? null;
    return { primary, sorted, totalReviews, modelScores, dbImageUrl };
  });

  const slugsNeedingWiki = modelCards.filter((m) => !m.dbImageUrl).map((m) => m.primary.slug);
  const wikiUrls = slugsNeedingWiki.length > 0 ? await getVehicleImageUrls(slugsNeedingWiki) : {};

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">

      {/* Başlık */}
      <div className="mb-6">
        {query ? (
          <>
            <h1 className="text-xl font-bold text-gray-900">
              &ldquo;{query}&rdquo; için sonuçlar
            </h1>
            <p className="text-sm text-gray-400 mt-0.5">
              {modelCards.length > 0
                ? `${modelCards.length} model bulundu`
                : "Sonuç bulunamadı"}
            </p>
          </>
        ) : (
          <h1 className="text-xl font-bold text-gray-900">Araç Ara</h1>
        )}
      </div>

      {/* Arama kutusu */}
      <form action="/arama" method="GET" className="mb-8">
        <div className="relative max-w-xl">
          <input
            name="q"
            type="search"
            defaultValue={query}
            placeholder="Araç, marka veya model ara..."
            autoFocus={!query}
            className="w-full pl-10 pr-24 py-3 rounded-2xl border border-gray-200 bg-white text-sm shadow-sm placeholder-gray-400 focus:outline-none focus:border-gray-400 transition-colors"
          />
          <svg
            className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
            fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"
          >
            <circle cx={11} cy={11} r={8} />
            <path strokeLinecap="round" d="m21 21-4.35-4.35" />
          </svg>
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 rounded-xl text-sm font-semibold text-white transition-colors"
            style={{ background: "#111" }}
          >
            Ara
          </button>
        </div>
      </form>

      {/* Sonuç yok */}
      {query.length >= 2 && modelCards.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-4">🔍</p>
          <p className="font-semibold text-gray-600 text-lg mb-1">Sonuç bulunamadı</p>
          <p className="text-sm mb-6">
            &ldquo;{query}&rdquo; ile eşleşen araç yok.{" "}
            <Link href="/" className="underline text-gray-900 hover:text-gray-600 transition-colors">
              Tüm araçlara göz at
            </Link>
          </p>
          <Link
            href={`/oner?brandName=${encodeURIComponent(query)}`}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-colors"
            style={{ background: "#111" }}
          >
            <span>+</span>
            Bu aracı öner
          </Link>
        </div>
      )}

      {/* Kısa sorgu uyarısı */}
      {query.length > 0 && query.length < 2 && (
        <p className="text-sm text-gray-400">En az 2 karakter gir.</p>
      )}

      {/* Boş sayfa */}
      {!query && (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-4">🚗</p>
          <p className="text-sm">Marka, model veya araç adı yazarak arama yap.</p>
        </div>
      )}

      {/* Sonuç kartları */}
      {modelCards.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {modelCards.map(({ primary, sorted, totalReviews, modelScores, dbImageUrl }) => {
            const imageUrl = dbImageUrl ?? wikiUrls[primary.slug] ?? null;

            const variantChips = sorted.map((v) => ({
              slug:     v.slug,
              year:     v.year,
              trimName: v.trimName,
              fuelType: String((v.attributes as Record<string, unknown>).fuel_type ?? ""),
            }));

            return (
              <VehicleCard
                key={primary.modelId}
                primarySlug={primary.slug}
                brandName={primary.brand.name}
                modelName={primary.model.name}
                attributes={primary.attributes as Record<string, unknown>}
                scores={modelScores}
                totalReviews={totalReviews}
                imageUrl={imageUrl}
                variants={variantChips}
              />
            );
          })}
        </div>
      )}

    </div>
  );
}
