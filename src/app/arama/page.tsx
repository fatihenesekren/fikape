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
import { aramaDurumu, aramaKaynagi } from "@/lib/aramaDurumu";
import type { FikapeScores } from "@/lib/fikape";
import { AramaSearchBox } from "./AramaSearchBox";
import { BosArama } from "./BosArama";

export const dynamic = "force-dynamic";

type AramaParams = Promise<Record<string, string | string[] | undefined>>;

export async function generateMetadata({ searchParams }: { searchParams: AramaParams }): Promise<Metadata> {
  const { durum, q } = aramaDurumu((await searchParams).q);
  // Arama sayfası dizine girmez; bağlantıları izlenebilsin (follow). Canonical yok (noindex ile çelişir).
  const robots = { index: false, follow: true };
  if (durum !== "sonuc") {
    return { title: "Araç Ara", description: "Marka, model veya araç adıyla katalogda arayın.", robots };
  }
  const kisa = q.length > 60 ? `${q.slice(0, 57)}…` : q;
  return { title: `"${kisa}" için arama sonuçları`, robots };
}

async function SearchResults({ query, kaynak }: { query: string; kaynak: "cip" | "arama" }) {
  const search = await searchProductIds(query);

  // Sıfır-sonuç / az-sonuç aramalar kataloğa aday sinyali — fire-and-forget log
  // (erken çıkıştan ÖNCE, yoksa sıfır-sonuç hiç loglanmaz). Hazır çip tıklamaları "cip" kaynağıyla ayrılır.
  logSearch(query, search.ids.length, kaynak);

  // Sorgu var ama hiç eşleşme (fuzzy dahil) yok → tam genişlik "öner" daveti.
  // Bu erken çıkış, /oner katalog-büyütme hunisini korur (düşük güvenli fuzzy
  // sonuç dönmediği için burada yakalanır).
  if (search.ids.length === 0) {
    return <SearchNoMatchPrompt query={query} variant="empty" />;
  }

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
  const products = rows.sort((a, b) => (rank.get(a.id) ?? 0) - (rank.get(b.id) ?? 0));

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
      {search.fuzzy && (
        <p role="status" className="text-sm text-amber-800 bg-amber-50 border border-amber-100 rounded-xl px-4 py-2.5 mb-4">
          &ldquo;{query}&rdquo; için tam eşleşme bulunamadı — benzer sonuçları gösteriyoruz.
        </p>
      )}
      <p className="text-sm text-gray-500 mb-5">
        {search.fuzzy ? `${products.length} benzer sonuç` : `${products.length} araç bulundu`}
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
              transmission={attrs.transmission ? String(attrs.transmission) : null}
              scores={score?.scores ?? null}
              imageUrl={imageUrl}
              isLoggedIn={isLoggedIn}
              initialFavorited={favoritedIds.has(product.id)}
            />
          );
        })}
        {/* Aradığı tam varyantı (yıl, trim vb.) bulamamış olabilir — sonuçlar
            listesinin doğal bir parçası olarak "öner" seçeneğini göster. */}
        <SearchNoMatchPrompt query={query} variant="grid-tail" />
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

export default async function AramaPage({ searchParams }: { searchParams: AramaParams }) {
  const sp = await searchParams;
  const { durum, q } = aramaDurumu(sp.q);
  const kaynak = aramaKaynagi(sp.k);

  // Boş / tek karakterli arama: ortalı arama ekranı (sonuç listesi yok, "← Ana Sayfa" gerekmez — üst menü var).
  if (durum !== "sonuc") {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 pt-8 pb-16 sm:pt-16">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-gray-900">Araç Ara</h1>
          <p className="mt-2 text-base text-gray-600">Marka, model veya araç adıyla katalogda arayın.</p>
        </div>
        <AramaSearchBox query={q} ortali />
        <BosArama />
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-8">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 mb-4 transition-colors"
      >
        ← Ana Sayfa
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-black text-gray-900 break-words">
          &ldquo;{q}&rdquo; için sonuçlar
        </h1>
      </div>

      <AramaSearchBox query={q} />

      <Suspense fallback={<SearchResultsSkeleton />}>
        <SearchResults query={q} kaynak={kaynak} />
      </Suspense>
    </div>
  );
}
