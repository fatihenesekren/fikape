import { Suspense } from "react";
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
    title: q ? `"${q}" için arama sonuçları — fikape` : "Araç Ara — fikape",
    robots: { index: false },
  };
}

function normalize(str: string) {
  return str
    .toLowerCase()
    .replace(/ş/g, "s")
    .replace(/ç/g, "c")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ö/g, "o")
    .replace(/ı/g, "i")
    .replace(/İ/g, "i");
}

async function SearchResults({ query }: { query: string }) {
  const allProducts = await prisma.product.findMany({
    where: { isActive: true },
    include: {
      brand: true,
      model: true,
      category: true,
      _count: { select: { reviews: { where: { status: "PUBLISHED" } } } },
    },
    orderBy: [{ brand: { name: "asc" } }, { year: "desc" }],
  });

  type ProductItem = typeof allProducts[number];

  const nq = normalize(query);
  const products: ProductItem[] = query.length >= 2
    ? allProducts.filter((p) =>
        normalize(p.name).includes(nq) ||
        normalize(p.brand.name).includes(nq) ||
        normalize(p.model.name).includes(nq) ||
        (p.trimName ? normalize(p.trimName).includes(nq) : false)
      )
    : allProducts;

  // Puan ortalamaları
  const productIds = products.map((p) => p.id);
  const scoreAggs = productIds.length
    ? await prisma.review.groupBy({
        by: ["productId"],
        where: { status: "PUBLISHED", productId: { in: productIds } },
        _avg: {
          scoreFiyat: true,
          scoreKalite: true,
          scorePerformans: true,
          scoreOverall: true,
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

  // Model bazında grupla
  const modelGroups = new Map<number, ProductItem[]>();
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
      ? {
          scoreFiyat:      wFiyat      / totalReviews,
          scoreKalite:     wKalite     / totalReviews,
          scorePerformans: wPerformans / totalReviews,
          scoreOverall:    wOverall    / totalReviews,
        }
      : null;

    const dbImageUrl = sorted.find((v) => v.imageUrl)?.imageUrl ?? null;
    return { primary, sorted, totalReviews, modelScores, dbImageUrl };
  });

  // Wikipedia görselleri — sadece DB'de olmayan kartlar için
  const slugsNeedingWiki = modelCards.filter((m) => !m.dbImageUrl).map((m) => m.primary.slug);
  const wikiUrls = slugsNeedingWiki.length > 0 ? await getVehicleImageUrls(slugsNeedingWiki) : {};

  if (query.length >= 2 && modelCards.length === 0) {
    return (
      <div className="text-center py-20 text-gray-400">
        <p className="text-5xl mb-4">🔍</p>
        <p className="font-semibold text-gray-700 text-lg mb-1">Sonuç bulunamadı</p>
        <p className="text-sm mb-6">
          &ldquo;{query}&rdquo; ile eşleşen araç yok.{" "}
          <Link href="/arama" className="underline text-gray-900 hover:text-gray-600 transition-colors">
            Tümünü gör
          </Link>
        </p>
        <Link
          href={`/oner?brandName=${encodeURIComponent(query)}`}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-colors"
          style={{ background: "#111" }}
        >
          <span>+</span> Bu aracı öner
        </Link>
      </div>
    );
  }

  return (
    <>
      <p className="text-sm text-gray-400 mb-5">
        {query.length >= 2
          ? `${modelCards.length} model bulundu`
          : `${modelCards.length} araç`}
      </p>
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
              categorySlug={primary.category?.slug ?? "otomobil"}
              attributes={primary.attributes as Record<string, unknown>}
              scores={modelScores}
              totalReviews={totalReviews}
              imageUrl={imageUrl}
              variants={variantChips}
            />
          );
        })}
      </div>
    </>
  );
}

function SearchResultsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-gray-100 bg-white overflow-hidden animate-pulse">
          <div className="h-40 bg-gray-100" />
          <div className="p-4 space-y-2">
            <div className="h-3 w-1/3 bg-gray-100 rounded" />
            <div className="h-4 w-2/3 bg-gray-100 rounded" />
            <div className="h-3 w-full bg-gray-100 rounded mt-3" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default async function AramaPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Başlık */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">
          {query ? <>&ldquo;{query}&rdquo; için sonuçlar</> : "Tüm Araçlar"}
        </h1>
      </div>

      {/* Arama kutusu */}
      <form action="/arama" method="GET" className="mb-8">
        <div className="relative max-w-xl">
          <input
            name="q"
            type="search"
            defaultValue={query}
            placeholder="Marka, model veya araç adı ara..."
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
        {query.length > 0 && query.length < 2 && (
          <p className="text-xs text-gray-400 mt-2 pl-1">En az 2 karakter gir.</p>
        )}
      </form>

      {/* Sonuçlar — Suspense ile Wikipedia fetch izole */}
      <Suspense fallback={<SearchResultsSkeleton />}>
        <SearchResults query={query} />
      </Suspense>
    </div>
  );
}
