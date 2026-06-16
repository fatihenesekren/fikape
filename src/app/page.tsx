import { prisma } from "@/lib/prisma";
import { VehicleCard } from "@/components/VehicleCard";
import { getVehicleImageUrls } from "@/lib/vehicleImages";
import type { FikapeScores } from "@/lib/fikape";

const FUEL_FILTERS = [
  { key: "hepsi",    label: "Tüm Araçlar" },
  { key: "EV",       label: "⚡ Elektrikli" },
  { key: "HYBRID",   label: "🔋 Hibrit" },
  { key: "GASOLINE", label: "🔥 Benzin" },
  { key: "DIESEL",   label: "🛢️ Dizel" },
];

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ yakit?: string }>;
}) {
  const { yakit } = await searchParams;
  const fuelFilter = yakit && yakit !== "hepsi" ? yakit : undefined;

  // Tüm aktif ürünleri çek (filtre uygulanmış)
  const products = await prisma.product.findMany({
    where: {
      isActive: true,
      ...(fuelFilter
        ? { attributes: { path: ["fuel_type"], equals: fuelFilter } }
        : {}),
    },
    include: {
      brand: true,
      model: true,
      _count: { select: { reviews: { where: { status: "PUBLISHED" } } } },
    },
    orderBy: [{ brand: { name: "asc" } }, { year: "desc" }],
  });

  // Yayınlanan yorumların ürün bazlı ortalama puanları
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

  // Ürünleri model bazında grupla (yıl desc sıralı)
  type Product = (typeof products)[number];
  const modelGroups = new Map<number, Product[]>();
  for (const p of products) {
    const group = modelGroups.get(p.modelId) ?? [];
    group.push(p);
    modelGroups.set(p.modelId, group);
  }

  // Her model grubu için kart verisi hesapla
  const modelCards = Array.from(modelGroups.values()).map((variants) => {
    const sorted = [...variants].sort((a, b) => (b.year ?? 0) - (a.year ?? 0));
    const primary = sorted[0];

    // Ağırlıklı ortalama puan (inceleme sayısına göre)
    let totalReviews = 0;
    let wFiyat = 0, wKalite = 0, wPerformans = 0, wOverall = 0;
    for (const v of variants) {
      const entry = scoreMap.get(v.id);
      if (entry && entry.count > 0) {
        totalReviews += entry.count;
        wFiyat      += entry.scores.scoreFiyat      * entry.count;
        wKalite     += entry.scores.scoreKalite     * entry.count;
        wPerformans += entry.scores.scorePerformans * entry.count;
        wOverall    += (entry.scores.scoreOverall ?? 0) * entry.count;
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

    // DB'den imageUrl — boşsa Wikipedia'ya düşeceğiz
    const dbImageUrl = sorted.find((v) => v.imageUrl)?.imageUrl ?? null;

    return { primary, sorted, totalReviews, modelScores, dbImageUrl };
  });

  // Sadece DB imageUrl'i olmayan modeller için Wikipedia çağır
  const slugsNeedingWiki = modelCards
    .filter((m) => !m.dbImageUrl)
    .map((m) => m.primary.slug);

  const wikiUrls = slugsNeedingWiki.length > 0
    ? await getVehicleImageUrls(slugsNeedingWiki)
    : {};

  const activeFilter = yakit ?? "hepsi";

  return (
    <>
      {/* Hero */}
      <section className="bg-[#111] text-white">
        <div className="max-w-7xl mx-auto px-4 py-16 text-center">
          <div className="flex items-center justify-center gap-1 text-5xl font-black tracking-tight mb-4 select-none">
            <span style={{ color: "#85B7EB" }}>fi</span>
            <span className="text-gray-600 font-light">·</span>
            <span style={{ color: "#97C459" }}>ka</span>
            <span className="text-gray-600 font-light">·</span>
            <span style={{ color: "#F0997B" }}>pe</span>
          </div>
          <p className="text-gray-400 text-lg max-w-md mx-auto leading-relaxed">
            <span style={{ color: "#85B7EB" }}>Fi</span>yat ·{" "}
            <span style={{ color: "#97C459" }}>Ka</span>lite ·{" "}
            <span style={{ color: "#F0997B" }}>Pe</span>rformans
          </p>
          <p className="text-gray-500 text-sm mt-2">
            Gerçek kullanıcılar, gerçek deneyimler
          </p>
        </div>
      </section>

      {/* Filtre */}
      <section className="border-b border-gray-100 bg-white sticky top-14 z-40">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-2 overflow-x-auto py-3 scrollbar-none">
            {FUEL_FILTERS.map((f) => {
              const isActive = activeFilter === f.key;
              const url = f.key === "hepsi" ? "/" : `/?yakit=${f.key}`;
              return (
                <a
                  key={f.key}
                  href={url}
                  className="shrink-0 px-4 py-1.5 rounded-full text-sm font-semibold border transition-colors"
                  style={
                    isActive
                      ? { background: "#111", color: "#fff", borderColor: "#111" }
                      : { background: "#fff", color: "#555", borderColor: "#e5e7eb" }
                  }
                >
                  {f.label}
                </a>
              );
            })}
          </div>
        </div>
      </section>

      {/* Araç listesi */}
      <section className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-sm font-semibold text-gray-500">
            {modelCards.length} model
          </h2>
        </div>

        {modelCards.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            Bu filtrede araç bulunamadı.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {modelCards.map(({ primary, sorted, totalReviews, modelScores, dbImageUrl }) => {
              const imageUrl = dbImageUrl ?? wikiUrls[primary.slug] ?? null;

              // Varyant chip'leri: aynı modelin tüm yıl/paket kombinasyonları
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
      </section>

      {/* FI·KA·PE açıklama */}
      <section className="max-w-7xl mx-auto px-4 pb-8">
        <div className="rounded-2xl border border-gray-100 bg-white p-6 grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
          {[
            { short: "FI", word: "Fiyat", desc: "Para vermeye değdi mi? Bütçene göre doğru seçim miydi?", color: "#1a6fa0", bg: "#e8f4fd" },
            { short: "KA", word: "Kalite", desc: "Dayanıklılık, montaj kalitesi, uzun vadede güven veriyor mu?", color: "#2d7d32", bg: "#edf7ee" },
            { short: "PE", word: "Performans", desc: "Günlük kullanım nasıl? Sürüş hissi, konfor, teknoloji.", color: "#e65100", bg: "#fff3e0" },
          ].map(({ short, word, desc, color, bg }) => (
            <div key={short} className="rounded-xl p-4" style={{ background: bg }}>
              <div className="text-2xl font-black mb-1" style={{ color }}>{short}</div>
              <div className="text-sm font-bold mb-1" style={{ color }}>{word}</div>
              <div className="text-xs text-gray-500 leading-relaxed">{desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Alt banner — CTA */}
      <section className="bg-[#111] text-white mt-4">
        <div className="max-w-7xl mx-auto px-4 py-14 text-center">
          <div className="flex items-center justify-center gap-1 text-3xl font-black tracking-tight mb-3 select-none">
            <span style={{ color: "#85B7EB" }}>fi</span>
            <span className="text-gray-600 font-light">·</span>
            <span style={{ color: "#97C459" }}>ka</span>
            <span className="text-gray-600 font-light">·</span>
            <span style={{ color: "#F0997B" }}>pe</span>
          </div>
          <p className="text-gray-400 text-sm mb-1">
            <span style={{ color: "#85B7EB" }}>Fiyat</span>
            {" · "}
            <span style={{ color: "#97C459" }}>Kalite</span>
            {" · "}
            <span style={{ color: "#F0997B" }}>Performans</span>
          </p>
          <p className="text-gray-500 text-sm mb-8">
            Gerçek kullanıcılar, gerçek deneyimler.
          </p>
          <a
            href="/yorum-yaz"
            className="inline-flex items-center gap-2 px-7 py-3 rounded-xl font-semibold text-sm text-[#111] bg-white hover:bg-gray-100 transition-colors"
          >
            Deneyimini paylaş →
          </a>
        </div>
      </section>
    </>
  );
}
