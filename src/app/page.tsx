import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { FUEL_FILTERS } from "@/lib/fuel";
import { HeroSection } from "./_components/HeroSection";
import { ProductGrid } from "./_components/ProductGrid";
import { CardGridSkeleton } from "./_components/CardGridSkeleton";
import { RecentReviews } from "./_components/RecentReviews";
import { ScrollFadeRow } from "@/components/ScrollFadeRow";
import { decodeQuiz, CAT_TO_SLUG } from "@/lib/quiz";
import Link from "next/link";

export const dynamic = "force-dynamic";

const CATEGORY_FILTERS = [
  { key: "hepsi",       label: "Tümü",       icon: "🔍" },
  { key: "otomobil",    label: "Araba",       icon: "🚗" },
  { key: "motosiklet",  label: "Motosiklet",  icon: "🏍️" },
  { key: "e-scooter",   label: "E-Scooter",   icon: "⚡" },
  { key: "e-bisiklet",  label: "E-Bisiklet",  icon: "🚴" },
  { key: "karavan",     label: "Karavan",     icon: "🏕️" },
  { key: "kamyonet",    label: "Kamyonet",    icon: "🛻" },
] as const;

const CATEGORY_ICONS: Record<string, string> = {
  otomobil: "🚗", motosiklet: "🏍️", "e-scooter": "⚡",
  "e-bisiklet": "🚴", karavan: "🏕️", kamyonet: "🛻",
};

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ kategori?: string; yakit?: string; dogrulama?: string; quiz?: string }>;
}) {
  const { kategori, yakit, dogrulama, quiz } = await searchParams;
  const catFilter      = kategori && kategori !== "hepsi" ? kategori : undefined;
  const fuelFilter     = yakit    && yakit    !== "hepsi" ? yakit    : undefined;
  const quizParam      = quiz ?? undefined;
  const activeCategory = kategori ?? "hepsi";
  const activeFuel     = yakit    ?? "hepsi";
  const showFuelFilter = catFilter === "otomobil";

  // Trend — sadece filtre yokken, haftalık görüntülemesi olanlar
  const trendProducts = !catFilter
    ? await prisma.product.findMany({
        where: { isActive: true, weeklyViewCount: { gt: 0 } },
        include: { brand: true, model: true, category: true },
        orderBy: { weeklyViewCount: "desc" },
        take: 8,
      })
    : [];

  return (
    <>
      {/* ── Doğrulama banner'ları ── */}
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

      {/* ── Hero ── */}
      <HeroSection />

      {/* ── Kategori + Yakıt filtresi (sticky) ── */}
      <section className="border-b border-gray-100 bg-white sticky top-14 z-40">
        <div className="max-w-7xl mx-auto px-4">

          <div className="flex gap-2 overflow-x-auto py-3 scrollbar-none">
            {/* Quiz chip — görünür olduğunda kategori chiplerinden önce */}
            {quizParam && (() => {
              const qa = decodeQuiz(quizParam);
              if (!qa) return null;
              const catSlug  = CAT_TO_SLUG[qa.cat];
              const clearUrl = catSlug ? `/?kategori=${catSlug}` : "/";
              return (
                <a
                  href={clearUrl}
                  className="shrink-0 px-3 py-1.5 rounded-full text-sm font-semibold border flex items-center gap-1.5"
                  style={{ background: "#111", color: "#fff", borderColor: "#111" }}
                >
                  <span>🎯</span>
                  <span>Araç Bul</span>
                  <span className="opacity-60 ml-0.5">✕</span>
                </a>
              );
            })()}
            {CATEGORY_FILTERS.map((f) => {
              const isActive = activeCategory === f.key && !quizParam;
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

      {/* ── Trend şeridi (filtre yokken) ── */}
      {!catFilter && trendProducts.length > 0 && (
        <section className="w-full max-w-7xl mx-auto px-4 pt-8 pb-2">
          <h2 className="text-sm font-bold text-gray-900 mb-3">
            Bu hafta ilgi gören araçlar
          </h2>
          <ScrollFadeRow>
            {trendProducts.map((p) => {
              const icon = CATEGORY_ICONS[p.category?.slug ?? "otomobil"] ?? "🚗";
              return (
                <Link
                  key={p.id}
                  href={`/araclar/${p.slug}`}
                  data-scroll-card
                  className="shrink-0 snap-start w-48 flex items-center gap-2 px-3 py-2.5 rounded-xl border border-gray-100 bg-white hover:border-gray-300 transition-colors"
                >
                  <span className="text-lg shrink-0">{icon}</span>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-gray-900 truncate">
                      {p.brand.name} {p.model.name}
                    </div>
                    <div className="text-xs text-gray-400">{p.year}</div>
                  </div>
                </Link>
              );
            })}
          </ScrollFadeRow>
        </section>
      )}

      {/* ── Son yorumlar (filtre yokken, koşullu) ── */}
      {!catFilter && <RecentReviews />}

      {/* ── Araç kartları (Suspense ile — Wikipedia API yavaşlığını izole eder) ── */}
      <Suspense fallback={<CardGridSkeleton />}>
        <ProductGrid
          catFilter={catFilter}
          fuelFilter={fuelFilter}
          activeCategory={activeCategory}
          quizParam={quizParam}
        />
      </Suspense>

      {/* ── FI·KA·PE açıklama ── */}
      <section className="w-full max-w-7xl mx-auto px-4 pb-8">
        <div className="rounded-2xl border border-gray-100 bg-white p-6 grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
          {[
            {
              short: "Fİ", word: "Fiyat",
              desc: "Para vermeye değdi mi? Bütçene göre doğru seçim miydi?",
              color: "#0C447C", bg: "#E6F1FB",
            },
            {
              short: "KA", word: "Kalite",
              desc: "Dayanıklılık, montaj kalitesi, uzun vadede güven veriyor mu?",
              color: "#27500A", bg: "#EAF3DE",
            },
            {
              short: "PE", word: "Performans",
              desc: "Günlük kullanım nasıl? Sürüş hissi, konfor, teknoloji.",
              color: "#712B13", bg: "#FAECE7",
            },
          ].map(({ short, word, desc, color, bg }) => (
            <div key={short} className="rounded-xl p-4" style={{ background: bg }}>
              <div className="text-2xl font-black mb-1" style={{ color }}>{short}</div>
              <div className="text-sm font-bold mb-1" style={{ color }}>{word}</div>
              <div className="text-xs text-gray-500 leading-relaxed">{desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Alt CTA ── */}
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
