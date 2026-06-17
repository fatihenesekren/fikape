import { prisma } from "@/lib/prisma";
import { VehicleCard } from "@/components/VehicleCard";
import { getVehicleImageUrls } from "@/lib/vehicleImages";
import type { FikapeScores } from "@/lib/fikape";

const CATEGORY_ICONS: Record<string, string> = {
  otomobil:    "🚗",
  motosiklet:  "🏍️",
  "e-scooter": "⚡",
  karavan:     "🏕️",
  kamyonet:    "🛻",
};

interface Props {
  catFilter?: string;
  fuelFilter?: string;
  activeCategory: string;
}

export async function ProductGrid({ catFilter, fuelFilter, activeCategory }: Props) {
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
    orderBy: [{ brand: { name: "asc" } }, { year: "desc" }],
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

  // Model bazında grupla
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

  // Wikipedia fallback — yalnızca imageUrl olmayan kartlar için
  const slugsNeedingWiki = modelCards
    .filter((m) => !m.dbImageUrl)
    .map((m) => m.primary.slug);
  const wikiUrls =
    slugsNeedingWiki.length > 0
      ? await getVehicleImageUrls(slugsNeedingWiki)
      : {};

  if (modelCards.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center py-20 text-gray-400">
          Bu filtrede araç bulunamadı.
        </div>
      </div>
    );
  }

  return (
    <section className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-sm font-semibold text-gray-500">
          {modelCards.length} model
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {modelCards.map(({ primary, sorted, totalReviews, modelScores, dbImageUrl }) => {
          const imageUrl  = dbImageUrl ?? wikiUrls[primary.slug] ?? null;
          const catSlug   = primary.category?.slug ?? "otomobil";
          const catIcon   = CATEGORY_ICONS[catSlug] ?? "🚗";

          const variantChips = sorted.map((v) => ({
            slug:     v.slug,
            year:     v.year,
            trimName: v.trimName,
            fuelType: String(
              (v.attributes as Record<string, unknown>).fuel_type ?? ""
            ),
          }));

          return (
            <div key={primary.modelId} className="relative">
              {activeCategory === "hepsi" && (
                <div className="absolute top-2 left-2 z-10 text-sm bg-white/80 backdrop-blur-sm rounded-full px-2 py-0.5 border border-gray-100 pointer-events-none">
                  {catIcon}
                </div>
              )}
              <VehicleCard
                primarySlug={primary.slug}
                brandName={primary.brand.name}
                modelName={primary.model.name}
                attributes={primary.attributes as Record<string, unknown>}
                scores={modelScores}
                totalReviews={totalReviews}
                imageUrl={imageUrl}
                variants={variantChips}
              />
            </div>
          );
        })}
      </div>
    </section>
  );
}
