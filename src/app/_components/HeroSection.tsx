import { getHeroStats, getTopRatedProduct } from "@/lib/dataCache";
import { FikapeScore } from "@/components/FikapeScore";

const POPULAR_SEARCHES = [
  "Toyota Corolla",
  "Ford Ranger",
  "Tesla Model Y",
  "Yamaha MT-07",
  "Vespa GTS",
];

export async function HeroSection() {
  const [stats, topRated] = await Promise.all([
    getHeroStats(),
    getTopRatedProduct(),
  ]);

  return (
    <section className="bg-[#111] text-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 py-14 sm:py-20 relative">

        {/* Glow — sol tarafta, başlığın arkasında */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 55% 70% at 15% 50%, rgba(12,68,124,0.35) 0%, transparent 65%)",
          }}
        />

        <div className="relative grid grid-cols-1 md:grid-cols-[1fr_320px] gap-10 lg:gap-20 items-center">

          {/* ── SOL: Metin + Arama ── */}
          <div>

            {/* Ana başlık */}
            <h1 className="text-4xl sm:text-5xl font-black leading-[1.1] tracking-tight mb-5">
              Aldın. Kullandın.{" "}
              <span
                style={{
                  background:
                    "linear-gradient(90deg, #85B7EB 0%, #97C459 55%, #F0997B 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                Anlat.
              </span>
            </h1>

            {/* Alt başlık */}
            <p className="text-gray-400 text-base leading-relaxed mb-8 max-w-sm">
              Kullanan bilir —{" "}
              <span style={{ color: "#85B7EB" }}>Fiyat</span>,{" "}
              <span style={{ color: "#97C459" }}>Kalite</span> ve{" "}
              <span style={{ color: "#F0997B" }}>Performans</span>{" "}
              puanlarıyla gerçek sahip deneyimleri.
            </p>

            {/* Arama kutusu */}
            <form action="/arama" method="GET" className="relative mb-4">
              <svg
                className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none"
                fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"
              >
                <circle cx={11} cy={11} r={8} />
                <path strokeLinecap="round" d="m21 21-4.35-4.35" />
              </svg>
              <input
                name="q"
                type="search"
                placeholder="Marka, model veya araç ara..."
                className="w-full pl-11 pr-28 py-3.5 rounded-2xl bg-white/8 border border-white/12 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-white/25 focus:bg-white/12 transition-all"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 px-5 py-2 rounded-xl text-sm font-bold text-[#111] bg-white hover:bg-gray-100 transition-colors"
              >
                Ara
              </button>
            </form>

            {/* Popüler aramalar */}
            <div className="flex flex-wrap gap-2 mb-8">
              <span className="text-xs text-gray-600 self-center">Örnek:</span>
              {POPULAR_SEARCHES.map((q) => (
                <a
                  key={q}
                  href={`/arama?q=${encodeURIComponent(q)}`}
                  className="text-xs px-3 py-1.5 rounded-full border border-white/10 text-gray-500 hover:border-white/20 hover:text-gray-300 transition-colors"
                >
                  {q}
                </a>
              ))}
            </div>

            {/* Stats — sıfır olanlar gizlenir */}
            <div className="flex items-center gap-2 text-sm text-gray-500 flex-wrap">
              <span>
                <span className="font-bold text-gray-300">{stats.totalModels}</span>{" "}
                araç modeli
              </span>
              {stats.totalReviews > 0 && (
                <>
                  <span className="text-gray-700">·</span>
                  <span>
                    <span className="font-bold text-gray-300">
                      {stats.totalReviews}
                    </span>{" "}
                    yorum
                  </span>
                </>
              )}
              <span className="text-gray-700">·</span>
              <a
                href="/yorum-yaz"
                className="font-semibold text-white underline underline-offset-2 decoration-gray-700 hover:decoration-gray-400 transition-colors"
              >
                Sen de yaz →
              </a>
            </div>
          </div>

          {/* ── SAĞ: Puan kartı (sadece desktop) ── */}
          <div className="hidden md:flex justify-center items-center">
            {topRated ? (
              /* Gerçek en yüksek puanlı araç */
              <div className="bg-white rounded-2xl shadow-2xl p-5 w-72 relative">
                <div
                  className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap"
                  style={{ background: "#FCD34D", color: "#78350F" }}
                >
                  ⭐ En yüksek puan
                </div>

                {topRated.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={topRated.imageUrl}
                    alt={`${topRated.brandName} ${topRated.modelName}`}
                    className="w-full h-36 object-cover rounded-xl mb-4"
                  />
                )}

                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">
                  {topRated.brandName}
                </div>
                <div className="text-base font-bold text-gray-900 mb-3">
                  {topRated.modelName}
                  {topRated.year && (
                    <span className="text-gray-400 font-normal ml-1.5">
                      · {topRated.year}
                    </span>
                  )}
                </div>

                <FikapeScore scores={topRated.scores} variant="chips" />

                <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-xs text-gray-400">
                    {topRated.reviewCount} kullanıcı yorumu
                  </span>
                  <a
                    href={`/araclar/${topRated.slug}`}
                    className="text-xs font-semibold text-gray-900 hover:text-gray-500 transition-colors"
                  >
                    İncele →
                  </a>
                </div>
              </div>
            ) : (
              /* Konsept kartı — henüz yorum yok */
              <div
                className="rounded-2xl p-6 w-72"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.09)",
                }}
              >
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-6 text-center">
                  Nasıl Çalışır?
                </p>

                <div className="space-y-3 mb-6">
                  {[
                    { short: "Fİ", label: "Fiyat", color: "#85B7EB", width: "72%" },
                    { short: "KA", label: "Kalite", color: "#97C459", width: "85%" },
                    { short: "PE", label: "Performans", color: "#F0997B", width: "78%" },
                  ].map(({ short, label, color, width }) => (
                    <div key={short} className="flex items-center gap-3">
                      <span
                        className="text-xs font-black shrink-0 w-5 text-right"
                        style={{ color }}
                      >
                        {short}
                      </span>
                      <span className="text-xs text-gray-500 w-20 shrink-0">{label}</span>
                      <div className="flex-1 h-1.5 rounded-full overflow-hidden bg-white/10">
                        <div
                          className="h-full rounded-full"
                          style={{ width, background: color, opacity: 0.75 }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <p className="text-xs text-gray-600 text-center leading-relaxed mb-5">
                  Her araç için 3 boyutlu puanlama.<br />
                  Gerçek sahiplerden gerçek veriler.
                </p>

                <div className="text-center">
                  <a
                    href="/yorum-yaz"
                    className="inline-block text-xs font-bold px-4 py-2 rounded-xl border border-white/12 text-gray-400 hover:text-white hover:border-white/25 transition-colors"
                  >
                    İlk yorumu sen yaz →
                  </a>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </section>
  );
}
