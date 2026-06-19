import { prisma } from "@/lib/prisma";
import { VehicleCard } from "@/components/VehicleCard";
import { getVehicleImageUrls } from "@/lib/vehicleImages";
import { calcOverall, type FikapeScores } from "@/lib/fikape";
import { NiyetKarti } from "./NiyetKarti";

const CATEGORY_ICONS: Record<string, string> = {
  otomobil:    "🚗",
  motosiklet:  "🏍️",
  "e-scooter": "🔋",
  karavan:     "🏕️",
  kamyonet:    "🛻",
};

const NIYET_LABELS: Record<string, string> = {
  fi:    'Fiyat / Değer',
  ka:    'Kalite',
  pe:    'Performans',
  karma: 'Dengeli',
};

function calcNiyetScore(scores: FikapeScores, keys: string[]): number {
  const vals: number[] = [];
  if (keys.includes('fi'))    vals.push(scores.scoreFiyat);
  if (keys.includes('ka'))    vals.push(scores.scoreKalite);
  if (keys.includes('pe'))    vals.push(scores.scorePerformans);
  if (keys.includes('karma')) vals.push(calcOverall(scores));
  return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length
    : calcOverall(scores);
}

interface Props {
  catFilter?: string;
  fuelFilter?: string;
  activeCategory: string;
  niyetFilter?: string;
}

export async function ProductGrid({ catFilter, fuelFilter, activeCategory, niyetFilter }: Props) {
  const products = await prisma.product.findMany({
    where: {
      isActive: true,
      ...(catFilter ? { category: { slug: catFilter } } : {}),
      ...(fuelFilter && (!catFilter || catFilter === "otomobil")
        ? { attributes: { path: ["fuel_type"], equals: fuelFilter } }
        : {}),
    },
    include: {
      brand: true,
      model: true,
      category: true,
      _count: { select: { reviews: { where: { status: "PUBLISHED" } } } },
    },
    orderBy: [{ brand: { name: "asc" } }, { model: { name: "asc" } }, { year: "desc" }],
  });

  const scoreAggs = await prisma.review.groupBy({
    by: ["productId"],
    where: { status: "PUBLISHED" },
    _avg: {
      scoreFiyat: true,
      scoreKalite: true,
      scorePerformans: true,
      scoreOverall: true,
    },
    _count: { id: true },
  });

  const scoreMap = new Map(
    scoreAggs.map((agg) => [
      agg.productId,
      {
        scores: {
          scoreFiyat:      agg._avg.scoreFiyat      ?? 0,
          scoreKalite:     agg._avg.scoreKalite     ?? 0,
          scorePerformans: agg._avg.scorePerformans ?? 0,
          scoreOverall:    agg._avg.scoreOverall    ?? 0,
        } as FikapeScores,
        count: agg._count.id,
      },
    ])
  );

  // Niyet sıralaması
  const niyetKeys = niyetFilter ? niyetFilter.split(',') : [];
  const niyetLabel = niyetKeys.length
    ? niyetKeys.map(k => NIYET_LABELS[k]).filter(Boolean).join(' + ') + ' skoru'
    : '';

  let sortedProducts = [...products];
  if (niyetKeys.length) {
    sortedProducts.sort((a, b) => {
      const sa = scoreMap.get(a.id)?.scores;
      const sb = scoreMap.get(b.id)?.scores;
      const va = sa ? calcNiyetScore(sa, niyetKeys) : 0;
      const vb = sb ? calcNiyetScore(sb, niyetKeys) : 0;
      return vb - va;
    });
  }

  // Wikipedia fallback — yalnızca imageUrl olmayan ürünler için
  const slugsNeedingWiki = products.filter((p) => !p.imageUrl).map((p) => p.slug);
  const wikiUrls = slugsNeedingWiki.length > 0
    ? await getVehicleImageUrls(slugsNeedingWiki)
    : {};

  if (products.length === 0) {
    return (
      <section className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {!niyetFilter && (
            <NiyetKarti baseUrl={catFilter ? `/?kategori=${catFilter}` : '/'} />
          )}
          <div className="col-span-full text-center py-20 text-gray-400">
            Bu filtrede araç bulunamadı.
          </div>
        </div>
      </section>
    );
  }

  const niyetBaseUrl = catFilter ? `/?kategori=${catFilter}` : '/';

  return (
    <section className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-sm font-semibold text-gray-500">
          {products.length} araç
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {/* Niyet kartı — sadece niyet aktif değilken ilk sırada */}
        {!niyetFilter && <NiyetKarti baseUrl={niyetBaseUrl} />}

        {sortedProducts.map((product, idx) => {
          const attrs    = product.attributes as Record<string, unknown>;
          const catSlug  = product.category?.slug ?? "otomobil";
          const catIcon  = CATEGORY_ICONS[catSlug] ?? "🚗";
          const score    = scoreMap.get(product.id);
          const imageUrl = product.imageUrl ?? wikiUrls[product.slug] ?? null;

          const niyetScore = niyetKeys.length && score?.scores
            ? calcNiyetScore(score.scores, niyetKeys)
            : undefined;

          return (
            <div key={product.id} className="relative">
              {activeCategory === "hepsi" && (
                <div className="absolute top-2 left-2 z-20 text-sm bg-white/80 backdrop-blur-sm rounded-full px-2 py-0.5 border border-gray-100 pointer-events-none">
                  {catIcon}
                </div>
              )}
              <VehicleCard
                slug={product.slug}
                brandName={product.brand.name}
                modelName={product.model.name}
                trimName={product.trimName ?? null}
                year={product.year ?? null}
                categorySlug={catSlug}
                fuelType={String(attrs.fuel_type ?? "")}
                bodyType={String(attrs.body_type ?? "")}
                scores={score?.scores ?? null}
                totalReviews={score?.count ?? 0}
                imageUrl={imageUrl}
                niyetScore={niyetScore}
                niyetLabel={niyetScore != null ? niyetLabel : undefined}
                isTopNiyet={niyetKeys.length > 0 && idx === 0 && niyetScore != null}
              />
            </div>
          );
        })}
      </div>
    </section>
  );
}
