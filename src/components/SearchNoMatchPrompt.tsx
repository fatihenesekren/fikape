import Link from "next/link";

// Arama sonucunda aradığı aracı bulamayan kullanıcı için TEK "öner" bileşeni.
// Tek görsel dille (daireli arama ikonu, davet başlığı, "+ Bu aracı önerin" koyu CTA, dashed kenarlık):
//   - variant="grid-tail": birkaç sonuç var, aranan yok → sonuç ızgarasının
//     son hücresi (VehicleCard boyutunda).
//   - variant="empty": hiç sonuç yok → tam genişlik panel + ikincil bağlantı + yazım ipucu.
//   - variant="inline": tam eşleşme var → küçük, sönük tek satır.

function SearchIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
      <path d="m20 20-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

// Ham arama metnini oner formuna taşır — orası `q`'yu kataloğa karşı çözüp
// marka/model alanlarını akıllıca ön-dolduruyor (bkz. oner/page.tsx mount
// effect'i). `brandName` değil çünkü sorgu bir marka OLMAYABİLİR.
// `kategori`: kategori içinde aranmışsa form o kategoriyle açılır.
const suggestHref = (query: string | undefined, kategori?: string, marka?: string) => {
  const qs = new URLSearchParams();
  if (query) qs.set("q", query.slice(0, 60));
  else if (marka) qs.set("brandName", marka.slice(0, 60));
  if (kategori) qs.set("kategori", kategori);
  const s = qs.toString();
  return s ? `/oner?${s}` : "/oner";
};

const FOCUS = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2";

export function SearchNoMatchPrompt({
  query,
  variant,
  kategori,
  marka,
  secondaryLink,
}: {
  /** Arama metni; yoksa (yalnız filtre/liste) genel metin gösterilir. */
  query?: string;
  variant: "grid-tail" | "empty" | "inline";
  /** /araclar kategori slug'ı — /oner'e taşınır. */
  kategori?: string;
  /** Seçili marka adı (arama metni yoksa /oner'e taşınır). */
  marka?: string;
  /** "empty" varyantında ikincil bağlantı (varsayılan: Tüm araçları gör → /araclar). */
  secondaryLink?: { href: string; label: string };
}) {
  const href = suggestHref(query, kategori, marka);

  if (variant === "inline") {
    return (
      <p className="mt-6 text-xs text-gray-600">
        Aradığınız araç yok mu?{" "}
        <Link href={href} className={`font-semibold text-link hover:underline rounded ${FOCUS}`}>
          Araç önerin
        </Link>
      </p>
    );
  }

  if (variant === "grid-tail") {
    return (
      <Link
        href={href}
        aria-label={query ? `"${query}" için araç önerin` : "Aradığınız aracı önerin"}
        className={`group flex flex-col items-center justify-center text-center bg-white rounded-2xl border-2 border-dashed border-gray-200 hover:border-gray-300 hover:bg-gray-50/50 transition-colors overflow-hidden h-full min-h-[280px] px-6 py-8 ${FOCUS}`}
      >
        <span className="w-12 h-12 rounded-full flex items-center justify-center bg-link-soft text-link group-hover:scale-105 transition-transform mb-3">
          <SearchIcon size={20} />
        </span>
        <p className="text-sm font-bold text-gray-900">{query ? "Aradığınız bu değil mi?" : "Aradığınız araç yok mu?"}</p>
        {query ? (
          <p className="text-xs text-gray-600 mt-1.5 leading-relaxed">
            &ldquo;<span className="break-all">{query}</span>&rdquo; için tam eşleşme yoksa
            <br />
            önerin, kataloğa ekleyelim.
          </p>
        ) : (
          <p className="text-xs text-gray-600 mt-1.5 leading-relaxed">
            Listede bulamadıysanız
            <br />
            önerin, kataloğa ekleyelim.
          </p>
        )}
        <span
          className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-white px-3.5 py-2 rounded-xl"
          style={{ background: "#111" }}
        >
          <span aria-hidden="true">+</span> Bu aracı önerin
        </span>
      </Link>
    );
  }

  const ikincil = secondaryLink ?? { href: "/araclar", label: "Tüm araçları gör" };
  return (
    <div className="rounded-2xl border-2 border-dashed border-gray-200 px-6 py-12 text-center">
      <span className="w-12 h-12 rounded-full flex items-center justify-center bg-link-soft text-link mx-auto mb-4">
        <SearchIcon size={22} />
      </span>
      <p role="status" className="text-base font-bold text-gray-900">
        &ldquo;<span className="break-all">{query}</span>&rdquo; için eşleşme yok
      </p>
      <p className="text-sm text-gray-600 mt-1.5 max-w-sm mx-auto leading-relaxed">
        Yazımı kontrol edin ya da bu aracı önerin, kataloğa ekleyelim.
      </p>
      <div className="mt-5">
        <Link
          href={href}
          className={`inline-flex items-center gap-1.5 text-sm font-semibold text-white px-5 py-2.5 rounded-xl transition-colors hover:bg-gray-800 ${FOCUS}`}
          style={{ background: "#111" }}
        >
          <span aria-hidden="true">+</span> Bu aracı önerin
        </Link>
      </div>
      <Link
        href={ikincil.href}
        className={`inline-block mt-4 text-sm font-semibold text-link hover:underline rounded ${FOCUS}`}
      >
        {ikincil.label}
      </Link>
    </div>
  );
}
