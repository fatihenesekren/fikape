import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { VehicleCard } from "@/components/VehicleCard";
import { getVehicleImageUrls } from "@/lib/vehicleImages";
import { NiyetKarti } from "./NiyetKarti";
import { decodeQuiz, calcQuizScore, quizQ4Matches, CAT_TO_SLUG, MOTO_CC_RANGES, EBIKE_WATT_RANGES, type ReviewExtData } from "@/lib/quiz";
import { calcShrunkScore } from "@/lib/brandIndex";
import type { FikapeScores } from "@/lib/fikape";

// Ana sayfa kürasyonu — ham liste /araclar'a taşındı, burada quiz yokken sadece
// "öne çıkanlar" gösterilir (bkz. backlog_anasayfa_katalog_ayirma).
const HOMEPAGE_LIMIT = 12;
const PER_CATEGORY_CAP = 3;
const CURATION_SHRINKAGE_M = 5;
const MIN_REVIEWED_FOR_CURATION = 6;

const CATEGORY_ICONS: Record<string, string> = {
  otomobil:     "🚗",
  motosiklet:   "🏍️",
  "e-scooter":  "🔋",
  "e-bisiklet": "🚴",
  karavan:      "🏕️",
  kamyonet:     "🛻",
};

interface Props {
  quizParam?: string;
}

export async function ProductGrid({ quizParam }: Props) {
  const quizAnswers = quizParam ? decodeQuiz(quizParam) : null;

  // Hard category filter: quiz kategorisi bir slug veriyorsa ona indir
  const effectiveCat = quizAnswers ? CAT_TO_SLUG[quizAnswers.cat] : undefined;

  let products = await prisma.product.findMany({
    where: {
      isActive: true,
      ...(effectiveCat ? { category: { slug: effectiveCat } } : {}),
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

  // E-Bisiklet "Motor gücü" sert filtresi — moto'nun cc filtresiyle aynı ilke (bkz. EBIKE_WATT_RANGES).
  if (quizAnswers?.cat === "ebike") {
    const wattRange = EBIKE_WATT_RANGES[quizAnswers.q3];
    if (wattRange) {
      products = products.filter((p) => {
        const watt = Number((p.attributes as Record<string, unknown>).motor_watt);
        return Number.isFinite(watt) && watt >= wattRange.min && watt <= wattRange.max;
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
  } else {
    // ── Ana sayfa kürasyonu — "Öne çıkan araçlar" (~12) ──
    // 0) Model bazında tekilleştir: aynı marka+modelin farklı yıl-varyantları
    //    ana sayfada yan yana görünmesin (bkz. kullanıcı geri bildirimi). Her
    //    modelId'den TEK temsilci: en çok yayınlanmış yorumlu yıl, eşitlikte en
    //    yeni yıl / en yeni kayıt. Tam katalog (/araclar) tekilleştirilmez.
    const byModel = new Map<number, (typeof products)[number]>();
    for (const p of products) {
      const cur = byModel.get(p.modelId);
      if (!cur) { byModel.set(p.modelId, p); continue; }
      const pCount = scoreMap.get(p.id)?.count ?? 0;
      const cCount = scoreMap.get(cur.id)?.count ?? 0;
      const better =
        pCount !== cCount
          ? pCount > cCount
          : (p.year ?? 0) !== (cur.year ?? 0)
            ? (p.year ?? 0) > (cur.year ?? 0)
            : p.createdAt.getTime() > cur.createdAt.getTime();
      if (better) byModel.set(p.modelId, p);
    }
    const deduped = [...byModel.values()];

    // 1) Aday havuzu: en az 1 yayınlanmış yorumu olanlar.
    const reviewed = deduped.filter((p) => scoreMap.has(p.id));

    if (reviewed.length < MIN_REVIEWED_FOR_CURATION) {
      // İnce veri koruması: model başına tek, en yeni. Kategori çeşitliliği:
      // her kategoriden ilk PER_CATEGORY_CAP, kalan slotlar sıradan — aksi halde
      // katalog otomobil-ağırlıklı olduğu için grid neredeyse hep otomobil olur.
      const newest = [...deduped].sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
      );
      const perCat = new Map<string, number>();
      const primary: typeof newest = [];
      const overflow: typeof newest = [];
      for (const p of newest) {
        const c = p.category?.slug ?? "?";
        const n = perCat.get(c) ?? 0;
        if (n < PER_CATEGORY_CAP) { perCat.set(c, n + 1); primary.push(p); }
        else overflow.push(p);
      }
      products = [...primary, ...overflow]
        .slice(0, HOMEPAGE_LIMIT)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    } else {
      // 2) Bayesçi ağırlıklı ortalama (calcShrunkScore) — tek 10/10'luk yorum
      //    sıralamayı domine edemesin. C = tüm yorumlanan ürünlerin genel ort.
      const globalAvg =
        reviewed.reduce((s, p) => s + (scoreMap.get(p.id)!.scores.scoreOverall || 0), 0) /
        reviewed.length;

      const scored = reviewed.map((p) => {
        const sm = scoreMap.get(p.id)!;
        return {
          p,
          w: calcShrunkScore({
            reviewCount: sm.count,
            rawAvg: sm.scores.scoreOverall || 0,
            categoryAvg: globalAvg,
            m: CURATION_SHRINKAGE_M,
          }),
        };
      });
      scored.sort(
        (a, b) =>
          b.w - a.w ||
          (b.p.weeklyViewCount ?? 0) - (a.p.weeklyViewCount ?? 0) ||
          b.p.createdAt.getTime() - a.p.createdAt.getTime(),
      );

      // 3) Kategori çeşitliliği: her kategoriden ilk PER_CATEGORY_CAP, kalan
      //    slotlar global sıradan.
      const perCat = new Map<string, number>();
      const primary: typeof scored = [];
      const overflow: typeof scored = [];
      for (const item of scored) {
        const c = item.p.category?.slug ?? "?";
        const n = perCat.get(c) ?? 0;
        if (n < PER_CATEGORY_CAP) {
          perCat.set(c, n + 1);
          primary.push(item);
        } else {
          overflow.push(item);
        }
      }
      const finalItems = [...primary, ...overflow]
        .slice(0, HOMEPAGE_LIMIT)
        .sort((a, b) => b.w - a.w);
      products = finalItems.map((x) => x.p);
    }
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

  const session = await auth();
  const isLoggedIn = !!session?.user?.id;
  let favoritedIds = new Set<number>();
  if (isLoggedIn) {
    const favs = await prisma.favorite.findMany({
      where: { userId: Number(session!.user!.id), productId: { in: products.map((p) => p.id) } },
      select: { productId: true },
    });
    favoritedIds = new Set(favs.map((f) => f.productId));
  }

  if (products.length === 0) {
    // Boş sonuç — NiyetKarti'yi (sonuç barı: Değiştir / ✕ Filtreyi kaldır /
    // tikli cevap çipleri) yine göster ki kullanıcı bir cevabı düzeltip tekrar
    // deneyebilsin veya filtreyi kaldırıp tüm araçlara dönebilsin. Önceden bu
    // dal sadece düz bir "bulunamadı" metni döndürüyordu → açık uç.
    return (
      <section className="w-full max-w-7xl mx-auto px-4 pt-4 pb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <NiyetKarti
            quizAnswers={quizAnswers}
            preCatSlug={null}
            categoryReviewCount={categoryReviewCount}
            showFeaturedHeading={false}
          />
          <div className="col-span-full text-center py-14 px-4">
            <p className="text-sm font-semibold text-gray-700">
              {quizAnswers ? "Bu kriterlere uyan araç bulunamadı." : "Henüz araç yok."}
            </p>
            {quizAnswers && (
              <p className="text-xs text-gray-400 mt-1.5 max-w-xs mx-auto leading-relaxed">
                Yukarıdaki karttan bir cevabı değiştirip tekrar deneyebilir ya da
                filtreyi kaldırıp tüm araçlara dönebilirsin.
              </p>
            )}
          </div>
        </div>
      </section>
    );
  }

  // Kürasyonlu ana sayfa görünümü kategoriler arası karışık — kart üstünde
  // kategori ikonu göster (quiz sonuçları tek kategori olduğu için gösterilmez).
  const showCatIcon = !quizAnswers;

  return (
    <section className="w-full max-w-7xl mx-auto px-4 pt-4 pb-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">

        {/* NiyetKarti — col-span-full, her zaman ilk. Quiz kapalıyken hemen
            altında "⭐ Öne çıkan araçlar" başlığını da kendisi render eder;
            quiz açılınca (seçim yapılırken) başlık da onunla birlikte kaybolur. */}
        <NiyetKarti
          quizAnswers={quizAnswers}
          preCatSlug={null}
          categoryReviewCount={categoryReviewCount}
          showFeaturedHeading={!quizAnswers}
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
                id={product.id}
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
                imageUrl={imageUrl}
                isLoggedIn={isLoggedIn}
                initialFavorited={favoritedIds.has(product.id)}
              />
            </div>
          );
        })}
      </div>
    </section>
  );
}
