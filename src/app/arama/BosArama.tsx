import Link from "next/link";
import { POPULAR_SEARCHES, populerAramaHref } from "@/lib/popularSearches";
import { KATEGORILER, kategoriHref } from "@/lib/kategoriler";
import { TumAraclarCta } from "@/app/_components/TumAraclarCta";

const FOCUS =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2";

// Boş / tek karakterli arama ekranı: popüler aramalar + kategoriye göre göz atma + tam katalog bağlantısı.
// Veritabanı sorgusu yok; yalnız Link ve saf modüller (VehicleCard/sharp zinciri buraya girmez).
export function BosArama() {
  return (
    <div className="max-w-2xl mx-auto text-center">
      <section aria-labelledby="populer-baslik" className="mt-6">
        <h2 id="populer-baslik" className="text-xs font-semibold text-gray-600 mb-3">Popüler aramalar</h2>
        <ul className="flex flex-wrap justify-center gap-2">
          {POPULAR_SEARCHES.map((q) => (
            <li key={q}>
              <Link
                href={populerAramaHref(q)}
                className={`inline-flex items-center min-h-11 px-4 rounded-full border border-gray-200 bg-white text-sm text-gray-800 hover:border-gray-900 hover:bg-gray-900 hover:text-white transition-colors ${FOCUS}`}
              >
                {q}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="kategori-baslik" className="mt-12 text-left">
        <h2 id="kategori-baslik" className="text-sm font-bold text-gray-900 mb-3 text-center">Kategoriye göre göz atın</h2>
        <ul className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {KATEGORILER.map((k) => (
            <li key={k.slug} className="min-w-0">
              <Link
                href={kategoriHref(k.slug)}
                className={`flex flex-col items-center justify-center gap-2 min-h-24 rounded-2xl border border-gray-200 bg-white px-3 py-4 text-sm font-semibold text-gray-900 hover:border-gray-400 hover:shadow-sm transition ${FOCUS}`}
              >
                <span aria-hidden="true" className="text-2xl leading-none">{k.icon}</span>
                <span className="truncate max-w-full">{k.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <TumAraclarCta
        aciklama="Ne aradığınızdan emin değil misiniz? Kataloğun tamamına göz atabilirsiniz."
        className="w-full mt-10"
      />
    </div>
  );
}
