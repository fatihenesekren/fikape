import { prisma } from "@/lib/prisma";
import { VehicleCard } from "@/components/VehicleCard";
import { getVehicleImageUrls } from "@/lib/vehicleImages";
import { NiyetKarti } from "./NiyetKarti";
import { decodeQuiz, calcQuizScore, quizQ4Matches, CAT_TO_SLUG, MOTO_CC_RANGES, type ReviewExtData } from "@/lib/quiz";
import type { FikapeScores } from "@/lib/fikape";

const CATEGORY_ICONS: Record<string, string> = {
  otomobil:     "🚗",
  motosiklet:   "🏍️",
  "e-scooter":  "🔋",
  "e-bisiklet": "🚴",
  karavan:      "🏕️",
  kamyonet:     "🛻",
};

interface Props {
  catFilter?:     string;
  fuelFilter?:    string;
  activeCategory: string;
  quizParam?:     string;
}

export async function ProductGrid({
  catFilter,
  fuelFilter,
  activeCategory,
  quizParam,
}: Props) {
  const quizAnswers = quizParam ? decodeQuiz(quizParam) : null;

  // Hard category filter: quiz cat takes precedence over filter bar if it provides a slug
  const quizCatSlug = quizAnswers ? CAT_TO_SLUG[quizAnswers.cat] : undefined;
  const effectiveCat = quizCatSlug ?? catFilter;

  let products = await prisma.product.findMany({
    where: {
      isActive: true,
      ...(effectiveCat ? { category: { slug: effectiveCat } } : {}),
      ...(fuelFilter && (!effectiveCat || effectiveCat === "otomobil")
        ? { attributes: { path: ["fuel_type"], equals: fuelFilter } }
        : {}),
    },
    include: {
      brand:    true,
      model:    true,
      category: true,
      _count: { select: { reviews: { where: { status: "PUBLISHED" } } } },
    },
    orderBy: [{ brand: { name: "asc" } }, { model: { name: "asc" } }, { year: "desc" }],
  });

  // Motosiklet "Motor hacmi" sert filtresi — quiz'te seçilen cc aralığının dışındaki
  // araçlar sonuçtan tamamen çıkarılır (bkz. MOTO_CC_RANGES, "farketmez" filtre koymaz).
  if (quizAnswers?.cat === "moto") {
    const ccRange = MOTO_CC_RANGES[quizAnswers.q3];
    if (ccRange) {
      products = products.filter((p) => {
        const cc = Number((p.attributes as Record<string, unknown>).engine_cc);
        return Number.isFinite(cc) && cc >= ccRange.min && cc <= ccRange.max;
      });
    }
  }

  // 4. soru sert filtresi — kategoriye göre yakıt/tip/güç/çekiş (bkz. quizQ4Matches)
  if (quizAnswers) {
    products = products.filter((p) =>
      quizQ4Matches(quizAnswers, p.attributes as Record<string, unknown>, p.category?.slug ?? null)
    );
  }

  const scoreAggs = await prisma.review.groupBy({
    by: ["productId"],
    where: { status: "PUBLISHED" },
    _avg: {
      scoreFiyat:      true,
      scoreKalite:     true,
      scorePerformans: true,
      scoreOverall:    true,
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
    ]),
  );

  // Review extendedData — only fetched for otomobil quiz (usage_type, maintenance_cost)
  const extDataMap = new Map<number, ReviewExtData[]>();
  if (quizAnswers?.cat === "oto") {
    const reviewsExt = await prisma.review.findMany({
      where:  { status: "PUBLISHED" },
      select: { productId: true, extendedData: true },
    });
    for (const r of reviewsExt) {
      const arr = extDataMap.get(r.productId) ?? [];
      arr.push(r.extendedData as ReviewExtData);
      extDataMap.set(r.productId, arr);
    }
  }

  // Quiz scoring + JS sort (overrides Prisma orderBy)
  if (quizAnswers) {
    products.sort((a, b) => {
      const sa = scoreMap.get(a.id);
      const sb = scoreMap.get(b.id);
      // Products without any reviews go last
      if (!sa && !sb) return 0;
      if (!sa) return 1;
      if (!sb) return -1;
      const scoreA = calcQuizScore(sa.scores, extDataMap.get(a.id) ?? [], quizAnswers).score;
      const scoreB = calcQuizScore(sb.scores, extDataMap.get(b.id) ?? [], quizAnswers).score;
      return scoreB - scoreA;
    });
  }

  // Quiz sonuç barındaki güven metni için: bu kategorideki gerçek yorum sayısı
  const categoryReviewCount = quizAnswers
    ? products.reduce((sum, p) => sum + (scoreMap.get(p.id)?.count ?? 0), 0)
    : undefined;

  // Wikipedia fallback — only for products missing imageUrl
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

  const showCatIcon = activeCategory === "hepsi" && !quizAnswers;

  return (
    <section className="w-full max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-sm font-semibold text-gray-500">
          {products.length} araç
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">

        {/* NiyetKarti — col-span-full, always first */}
        <NiyetKarti
          quizAnswers={quizAnswers}
          preCatSlug={catFilter ?? null}
          categoryReviewCount={categoryReviewCount}
        />

        {products.map((product) => {
          const attrs   = product.attributes as Record<string, unknown>;
          const catSlug = product.category?.slug ?? "otomobil";
          const catIcon = CATEGORY_ICONS[catSlug] ?? "🚗";
          const score   = scoreMap.get(product.id);
          const imageUrl = product.imageUrl ?? wikiUrls[product.slug] ?? null;

          return (
            <div key={product.id} className="relative">
              {showCatIcon && (
                <div className="absolute top-2 right-2 z-20 text-sm bg-white/80 backdrop-blur-sm rounded-full px-2 py-0.5 border border-gray-100 pointer-events-none">
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
                motorType={attrs.motor_type ? String(attrs.motor_type) : null}
                karavanType={attrs.karavan_type ? String(attrs.karavan_type) : null}
                motorWatt={attrs.motor_watt != null ? Number(attrs.motor_watt) : null}
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
