import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { VehicleCard } from "@/components/VehicleCard";
import { SearchNoMatchPrompt } from "@/components/SearchNoMatchPrompt";
import { getVehicleImageUrls } from "@/lib/vehicleImages";
import { searchProductIds } from "@/lib/searchProducts";
import { logSearch } from "@/lib/searchLog";
import type { FikapeScores } from "@/lib/fikape";

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

// Boş/tek-karakter sorguda önizleme kaç kart gösterilsin — önceden TÜM katalog
// sayfalamasız basılıyordu (bkz. ajan değerlendirmesi). Tam katalog /araclar'da.
const CATALOG_PREVIEW_LIMIT = 60;

async function SearchResults({ query }: { query: string }) {
  const search = query.length >= 2 ? await searchProductIds(query) : null;

  // Sıfır-sonuç / az-sonuç aramalar kataloğa aday sinyali — fire-and-forget log
  // (erken çıkıştan ÖNCE, yoksa sıfır-sonuç hiç loglanmaz).
  if (search) logSearch(query, search.ids.length, "arama");

  // Sorgu var ama hiç eşleşme (fuzzy dahil) yok → tam genişlik "öner" daveti.
  // Bu erken çıkış, /oner katalog-büyütme hunisini korur (düşük güvenli fuzzy
  // sonuç dönmediği için burada yakalanır).
  if (search && search.ids.length === 0) {
    return <SearchNoMatchPrompt query={query} variant="empty" />;
  }

  let products;
  if (search) {
    const rows = await prisma.product.findMany({
      where: { id: { in: search.ids } },
      include: {
        brand: true,
        model: true,
        category: true,
        _count: { select: { reviews: { where: { status: "PUBLISHED" } } } },
      },
    });
    // searchProductIds sırasını koru (Faz 1: marka/yıl · Faz 2: similarity).
    const rank = new Map(search.ids.map((id, i) => [id, i]));
    products = rows.sort((a, b) => (rank.get(a.id) ?? 0) - (rank.get(b.id) ?? 0));
  } else {
    products = await prisma.product.findMany({
      where: { isActive: true },
      include: {
        brand: true,
        model: true,
        category: true,
        _count: { select: { reviews: { where: { status: "PUBLISHED" } } } },
      },
      orderBy: [{ brand: { name: "asc" } }, { year: "desc" }],
      take: CATALOG_PREVIEW_LIMIT,
    });
  }

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

  // Wikipedia görselleri — sadece DB'de olmayan ürünler için
  const slugsNeedingWiki = products.filter((p) => !p.imageUrl).map((p) => p.slug);
  const wikiUrls = slugsNeedingWiki.length > 0 ? await getVehicleImageUrls(slugsNeedingWiki) : {};

  const session = await auth();
  const isLoggedIn = !!session?.user?.id;
  let favoritedIds = new Set<number>();
  if (isLoggedIn) {
    const favs = await prisma.favorite.findMany({
      where: { userId: Number(session!.user!.id), productId: { in: productIds } },
      select: { productId: true },
    });
    favoritedIds = new Set(favs.map((f) => f.productId));
  }

  return (
    <>
      {search?.fuzzy && (
        <p className="text-sm text-amber-800 bg-amber-50 border border-amber-100 rounded-xl px-4 py-2.5 mb-4">
          &ldquo;{query}&rdquo; için tam eşleşme bulunamadı — benzer sonuçları gösteriyoruz.
        </p>
      )}
      <p className="text-sm text-gray-400 mb-5">
        {search?.fuzzy
          ? `${products.length} benzer sonuç`
          : query.length >= 2
            ? `${products.length} araç bulundu`
            : `${products.length} araç`}
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {products.map((product) => {
          const attrs    = product.attributes as Record<string, unknown>;
          const catSlug  = product.category?.slug ?? "otomobil";
          const score    = scoreMap.get(product.id);
          const imageUrl = product.imageUrl ?? wikiUrls[product.slug] ?? null;

          return (
            <VehicleCard
              key={product.id}
              id={product.id}
              slug={product.slug}
              brandName={product.brand.name}
              modelName={product.model.name}
              trimName={product.trimName ?? null}
              year={product.year ?? null}
              categorySlug={catSlug}
              fuelType={String(attrs.fuel_type ?? "")}
              bodyType={String(attrs.body_type ?? "")}
              scores={score?.scores ?? null}
              imageUrl={imageUrl}
              isLoggedIn={isLoggedIn}
              initialFavorited={favoritedIds.has(product.id)}
            />
          );
        })}
        {/* Aradığı tam varyantı (yıl, trim vb.) bulamamış olabilir — sonuçlar
            listesinin doğal bir parçası olarak "öner" seçeneğini göster. */}
        {query.length >= 2 && <SearchNoMatchPrompt query={query} variant="grid-tail" />}
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
    <div className="w-full max-w-7xl mx-auto px-4 py-8">
      {/* Geri dönüş — /araclar ve /takas ile aynı yerleşim/stil (önceden
          /arama'da hiç yoktu, header logosu dışında ana sayfaya dönüş yolu
          bulunmuyordu). */}
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-400 hover:text-gray-600 mb-4 transition-colors"
      >
        ← Ana Sayfa
      </Link>

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
