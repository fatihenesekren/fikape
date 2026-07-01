import { getHeroStats, getTopRatedProducts } from "@/lib/dataCache";
import { HeroSlider } from "./HeroSlider";

const POPULAR_SEARCHES = [
  "Fiat Egea",
  "Tesla Model Y",
  "Ford Ranger",
  "Yamaha MT-07",
  "Togg T10X",
];

export async function HeroSection() {
  const [stats, topRatedProducts] = await Promise.all([
    getHeroStats(),
    getTopRatedProducts(),
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
              puanlarıyla gerçek kullanıcı deneyimleri.
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
            </div>
          </div>

          {/* ── SAĞ: Slider (sadece desktop) ── */}
          <div className="hidden md:flex justify-center items-center">
            <HeroSlider products={topRatedProducts} />
          </div>

        </div>
      </div>
    </section>
  );
}
