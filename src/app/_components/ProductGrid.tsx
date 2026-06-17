import { prisma } from "@/lib/prisma";
import { VehicleCard } from "@/components/VehicleCard";
import { getVehicleImageUrls } from "@/lib/vehicleImages";
import type { FikapeScores } from "@/lib/fikape";

const CATEGORY_ICONS: Record<string, string> = {
  otomobil:    "🚗",
  motosiklet:  "🏍️",
  "e-scooter": "🔋",
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

  // Wikipedia fallback — yalnızca imageUrl olmayan ürünler için
  const slugsNeedingWiki = products.filter((p) => !p.imageUrl).map((p) => p.slug);
  const wikiUrls = slugsNeedingWiki.length > 0
    ? await getVehicleImageUrls(slugsNeedingWiki)
    : {};

  if (products.length === 0) {
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
          {products.length} araç
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {products.map((product) => {
          const attrs    = product.attributes as Record<string, unknown>;
          const catSlug  = product.category?.slug ?? "otomobil";
          const catIcon  = CATEGORY_ICONS[catSlug] ?? "🚗";
          const score    = scoreMap.get(product.id);
          const imageUrl = product.imageUrl ?? wikiUrls[product.slug] ?? null;

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
              />
            </div>
          );
        })}
      </div>
    </section>
  );
}
