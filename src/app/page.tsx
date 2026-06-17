import { prisma } from "@/lib/prisma";
import { VehicleCard } from "@/components/VehicleCard";
import { getVehicleImageUrls } from "@/lib/vehicleImages";
import type { FikapeScores } from "@/lib/fikape";
import { FUEL_FILTERS } from "@/lib/fuel";
import Link from "next/link";

export const dynamic = "force-dynamic";

const CATEGORY_FILTERS = [
  { key: "hepsi",      label: "Tümü",          icon: "🔍" },
  { key: "otomobil",   label: "Araba",          icon: "🚗" },
  { key: "motosiklet", label: "Motosiklet",     icon: "🏍️" },
  { key: "e-scooter",  label: "E-Scooter",      icon: "⚡" },
  { key: "karavan",    label: "Karavan",         icon: "🏕️" },
  { key: "kamyonet",   label: "Kamyonet",        icon: "🛻" },
] as const;

const CATEGORY_ICONS: Record<string, string> = {
  otomobil:   "🚗",
  motosiklet: "🏍️",
  "e-scooter":"⚡",
  karavan:    "🏕️",
  kamyonet:   "🛻",
};

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ kategori?: string; yakit?: string; dogrulama?: string }>;
}) {
  const { kategori, yakit, dogrulama } = await searchParams;
  const catFilter  = kategori && kategori !== "hepsi" ? kategori : undefined;
  const fuelFilter = yakit && yakit !== "hepsi" ? yakit : undefined;

  // ── Trend Araçlar (en çok görüntülenen 8) ──────────────────
  const trendProducts = await prisma.product.findMany({
    where: { isActive: true, weeklyViewCount: { gt: 0 } },
    include: { brand: true, model: true, category: true },
    orderBy: { weeklyViewCount: "desc" },
    take: 8,
  });

  // ── Ürün listesi ───────────────────────────────────────────
  const products = await prisma.product.findMany({
    where: {
      isActive: true,
      ...(catFilter  ? { category: { slug: catFilter } } : {}),
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

  // Puan ortalamaları
  const scoreAggs = await prisma.review.groupBy({
    by: ["productId"],
    where: { status: "PUBLISHED" },
    _avg: {
      scoreFiyat: true, scoreKalite: true,
      scorePerformans: true, scoreOverall: true,
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
        wFiyat      += entry.scores.scoreFiyat      * entry.count;
        wKalite     += entry.scores.scoreKalite     * entry.count;
        wPerformans += entry.scores.scorePerformans * entry.count;
        wOverall    += (entry.scores.scoreOverall ?? 0) * entry.count;
      }
    }

    const modelScores: FikapeScores | null = totalReviews > 0
      ? { scoreFiyat: wFiyat / totalReviews, scoreKalite: wKalite / totalReviews,
          scorePerformans: wPerformans / totalReviews, scoreOverall: wOverall / totalReviews }
      : null;

    const dbImageUrl = sorted.find((v) => v.imageUrl)?.imageUrl ?? null;
    return { primary, sorted, totalReviews, modelScores, dbImageUrl };
  });

  const slugsNeedingWiki = modelCards.filter((m) => !m.dbImageUrl).map((m) => m.primary.slug);
  const wikiUrls = slugsNeedingWiki.length > 0 ? await getVehicleImageUrls(slugsNeedingWiki) : {};

  const activeCategory = kategori ?? "hepsi";
  const activeFuel     = yakit ?? "hepsi";
  const showFuelFilter = !catFilter || catFilter === "otomobil";

  // Stats for hero
  const [totalModels, totalReviews] = await Promise.all([
    prisma.model.count({ where: { products: { some: { isActive: true } } } }),
    prisma.review.count({ where: { status: "PUBLISHED" } }),
  ]);

  return (
    <>
      {/* Doğrulama banner */}
      {dogrulama === "tamam" && (
        <div className="bg-green-50 border-b border-green-100">
          <div className="max-w-7xl mx-auto px-4 py-3 text-sm font-semibold text-green-800">
            ✓ E-posta adresiniz doğrulandı. Hesabınız aktif!
          </div>
        </div>
      )}
      {dogrulama === "gecersiz" && (
        <div className="bg-red-50 border-b border-red-100">
          <div className="max-w-7xl mx-auto px-4 py-3 text-sm font-semibold text-red-700">
            Doğrulama linki geçersiz veya süresi dolmuş. Yeni link için giriş yapın.
          </div>
        </div>
      )}

      {/* Hero */}
      <section className="bg-[#111] text-white overflow-hidden">
        <div className="max-w-3xl mx-auto px-4 py-16 sm:py-20 text-center relative">

          {/* Soft glow accent */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-20"
            style={{
              background:
                "radial-gradient(ellipse 60% 40% at 50% 0%, #3b6fd4 0%, transparent 70%)",
            }}
          />

          {/* Wordmark */}
          <div className="relative flex items-center justify-center gap-0.5 text-sm font-bold tracking-widest uppercase text-gray-500 mb-6 select-none">
            <span style={{ color: "#85B7EB" }}>FI</span>
            <span className="text-gray-700 font-light mx-1">·</span>
            <span style={{ color: "#97C459" }}>KA</span>
            <span className="text-gray-700 font-light mx-1">·</span>
            <span style={{ color: "#F0997B" }}>PE</span>
          </div>

          {/* Headline */}
          <h1 className="relative text-4xl sm:text-5xl font-black leading-tight tracking-tight mb-4">
            Aracını aldın mı?{" "}
            <span
              className="block sm:inline"
              style={{
                background: "linear-gradient(90deg, #85B7EB, #97C459, #F0997B)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Anlat.
            </span>
          </h1>

          {/* Sub */}
          <p className="relative text-gray-400 text-base sm:text-lg max-w-xl mx-auto mb-8 leading-relaxed">
            Türkiye&apos;nin araç yorum platformu.{" "}
            <span style={{ color: "#85B7EB" }}>Fiyat</span>,{" "}
            <span style={{ color: "#97C459" }}>Kalite</span> ve{" "}
            <span style={{ color: "#F0997B" }}>Performans</span>{" "}
            puanlarıyla gerçek kullanıcı deneyimleri.
          </p>

          {/* Search bar */}
          <form
            action="/arama"
            method="GET"
            className="relative flex items-center max-w-xl mx-auto mb-8"
          >
            <input
              name="q"
              type="search"
              placeholder="Toyota Corolla, Honda CB500, Vespa GTS..."
              className="w-full pl-5 pr-32 py-3.5 rounded-2xl bg-white/10 border border-white/15 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-white/30 focus:bg-white/15 transition-all"
            />
            <button
              type="submit"
              className="absolute right-2 px-4 py-2 rounded-xl text-sm font-bold text-[#111] bg-white hover:bg-gray-100 transition-colors"
            >
              Araç Ara
            </button>
          </form>

          {/* Stats */}
          <div className="relative flex items-center justify-center gap-2 text-sm text-gray-500 flex-wrap">
            <span>
              <span className="font-bold text-gray-300">{totalModels}</span> araç modeli
            </span>
            <span className="text-gray-700">·</span>
            <span>
              <span className="font-bold text-gray-300">{totalReviews}</span> yorum
            </span>
            <span className="text-gray-700">·</span>
            <span>5 kategori</span>
            <span className="text-gray-700">·</span>
            <a
              href="/yorum-yaz"
              className="font-semibold text-white underline underline-offset-2 decoration-gray-600 hover:decoration-white transition-colors"
            >
              Sen de yaz →
            </a>
          </div>
        </div>
      </section>

      {/* Kategori filtresi */}
      <section className="border-b border-gray-100 bg-white sticky top-14 z-40">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-2 overflow-x-auto py-3 scrollbar-none">
            {CATEGORY_FILTERS.map((f) => {
              const isActive = activeCategory === f.key;
              const url = f.key === "hepsi" ? "/" : `/?kategori=${f.key}`;
              return (
                <a
                  key={f.key}
                  href={url}
                  className="shrink-0 px-4 py-1.5 rounded-full text-sm font-semibold border transition-colors flex items-center gap-1.5"
                  style={
                    isActive
                      ? { background: "#111", color: "#fff", borderColor: "#111" }
                      : { background: "#fff", color: "#555", borderColor: "#e5e7eb" }
                  }
                >
                  <span>{f.icon}</span>
                  <span>{f.label}</span>
                </a>
              );
            })}
          </div>

          {/* Yakıt filtresi — sadece Araba kategorisinde */}
          {showFuelFilter && (
            <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-none">
              {FUEL_FILTERS.map((f) => {
                const isActive = activeFuel === f.key;
                const base = catFilter ? `/?kategori=${catFilter}` : "/";
                const url  = f.key === "hepsi" ? base : `${base}&yakit=${f.key}`;
                return (
                  <a
                    key={f.key}
                    href={url}
                    className="shrink-0 px-3 py-1 rounded-full text-xs font-medium border transition-colors"
                    style={
                      isActive
                        ? { background: "#374151", color: "#fff", borderColor: "#374151" }
                        : { background: "#f9fafb", color: "#6b7280", borderColor: "#e5e7eb" }
                    }
                  >
                    {f.label}
                  </a>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Trend bölümü */}
      {!catFilter && trendProducts.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 pt-8 pb-2">
          <h2 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
            <span className="text-base">🔥</span> Trend
          </h2>
          <div className="flex gap-3 overflow-x-auto scrollbar-none pb-2">
            {trendProducts.map((p) => {
              const catSlug = p.category?.slug ?? "otomobil";
              const icon    = CATEGORY_ICONS[catSlug] ?? "🚗";
              return (
                <Link
                  key={p.id}
                  href={`/araclar/${p.slug}`}
                  className="shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-100 bg-white hover:border-gray-300 transition-colors"
                >
                  <span className="text-lg">{icon}</span>
                  <div>
                    <div className="text-xs font-semibold text-gray-900 whitespace-nowrap">
                      {p.brand.name} {p.model.name}
                    </div>
                    <div className="text-xs text-gray-400">{p.year}</div>
                  </div>
                  <div className="ml-1 text-xs text-gray-300 font-medium">
                    {p.weeklyViewCount.toLocaleString("tr-TR")} bu hafta
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

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
              const catSlug  = primary.category?.slug ?? "otomobil";
              const catIcon  = CATEGORY_ICONS[catSlug] ?? "🚗";

              const variantChips = sorted.map((v) => ({
                slug:     v.slug,
                year:     v.year,
                trimName: v.trimName,
                fuelType: String((v.attributes as Record<string, unknown>).fuel_type ?? ""),
              }));

              return (
                <div key={primary.modelId} className="relative">
                  {/* Kategori rozeti */}
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

      {/* Alt CTA */}
      <section className="bg-[#111] text-white mt-4">
        <div className="max-w-7xl mx-auto px-4 py-14 text-center">
          <p className="text-gray-300 text-lg font-bold mb-2">
            Aracın hakkında ne düşünüyorsun?
          </p>
          <p className="text-gray-500 text-sm mb-8">
            Yorumun bir sonraki alıcının kararını değiştirebilir.
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <a
              href="/yorum-yaz"
              className="inline-flex items-center gap-2 px-7 py-3 rounded-xl font-semibold text-sm text-[#111] bg-white hover:bg-gray-100 transition-colors"
            >
              Yorum Yaz →
            </a>
            <a
              href="/oner"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm text-white border border-white/20 hover:border-white/40 transition-colors"
            >
              Araç Öner
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
