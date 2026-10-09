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
const suggestHref = (query: string, kategori?: string) =>
  `/oner?q=${encodeURIComponent(query.slice(0, 60))}${kategori ? `&kategori=${encodeURIComponent(kategori)}` : ""}`;

const FOCUS =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2";

export function SearchNoMatchPrompt({
  query,
  variant,
  kategori,
  secondaryLink,
}: {
  query: string;
  variant: "grid-tail" | "empty" | "inline";
  /** /araclar kategori slug'ı — /oner'e taşınır. */
  kategori?: string;
  /** "empty" varyantında ikincil bağlantı (varsayılan: Tüm araçları gör → /araclar). */
  secondaryLink?: { href: string; label: string };
}) {
  const href = suggestHref(query, kategori);

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
        aria-label={`"${query}" için araç önerin`}
        className={`group flex flex-col items-center justify-center text-center bg-white rounded-2xl border-2 border-dashed border-gray-200 hover:border-gray-300 hover:bg-gray-50/50 transition-colors overflow-hidden h-full min-h-[280px] px-6 py-8 ${FOCUS}`}
      >
        <span className="w-12 h-12 rounded-full flex items-center justify-center bg-link-soft text-link group-hover:scale-105 transition-transform mb-3">
          <SearchIcon size={20} />
        </span>
        <p className="text-sm font-bold text-gray-900">Aradığınız bu değil mi?</p>
        <p className="text-xs text-gray-600 mt-1.5 leading-relaxed">
          &ldquo;<span className="break-all">{query}</span>&rdquo; için tam eşleşme yoksa
          <br />
          önerin, kataloğa ekleyelim.
        </p>
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
