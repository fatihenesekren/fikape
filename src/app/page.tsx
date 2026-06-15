import { prisma } from "@/lib/prisma";
import { VehicleCard } from "@/components/VehicleCard";
import { getVehicleImageUrls } from "@/lib/vehicleImages";
import type { FikapeScores } from "@/lib/fikape";

const FUEL_FILTERS = [
  { key: "hepsi",    label: "Tüm Araçlar" },
  { key: "EV",       label: "⚡ Elektrikli" },
  { key: "HYBRID",   label: "Hibrit" },
  { key: "GASOLINE", label: "Benzin" },
  { key: "DIESEL",   label: "Dizel" },
];

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ yakit?: string }>;
}) {
  const { yakit } = await searchParams;
  const fuelFilter = yakit && yakit !== "hepsi" ? yakit : undefined;

  // Ürünler ve review sayıları
  const products = await prisma.product.findMany({
    where: {
      isActive: true,
      ...(fuelFilter
        ? {
            attributes: {
              path: ["fuel_type"],
              equals: fuelFilter,
            },
          }
        : {}),
    },
    include: {
      brand: true,
      model: true,
      _count: {
        select: {
          reviews: { where: { status: "PUBLISHED" } },
        },
      },
    },
    orderBy: [{ brand: { name: "asc" } }, { year: "desc" }],
  });

  // Yayınlanan yorumların ortalama FI·KA·PE puanları
  const scoreAggs = await prisma.review.groupBy({
    by: ["productId"],
    where: { status: "PUBLISHED" },
    _avg: {
      scoreFiyat: true,
      scoreKalite: true,
      scorePerformans: true,
      scoreOverall: true,
    },
  });

  const scoreMap = new Map<number, FikapeScores>(
    scoreAggs.map((agg) => [
      agg.productId,
      {
        scoreFiyat:      agg._avg.scoreFiyat      ?? 0,
        scoreKalite:     agg._avg.scoreKalite     ?? 0,
        scorePerformans: agg._avg.scorePerformans ?? 0,
        scoreOverall:    agg._avg.scoreOverall    ?? 0,
      },
    ])
  );

  // Araç fotoğrafları (Wikipedia, 24s önbellekli)
  const imageUrls = await getVehicleImageUrls(products.map((p) => p.slug));

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
            Gerçek sahiplerden gerçek deneyimler
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
            {products.length} araç bulundu
          </h2>
        </div>

        {products.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            Bu filtrede araç bulunamadı.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {products.map((p) => (
              <VehicleCard
                key={p.id}
                slug={p.slug}
                brandName={p.brand.name}
                modelName={p.model.name}
                trimName={p.trimName}
                year={p.year}
                attributes={p.attributes as Record<string, unknown>}
                scores={scoreMap.get(p.id) ?? null}
                reviewCount={p._count.reviews}
                imageUrl={imageUrls[p.slug]}
              />
            ))}
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
    </>
  );
}
