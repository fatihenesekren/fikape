import Link from "next/link";
import type { TakasAdimKodu, TakasSonrakiAdim } from "@/lib/takasUygunluk";

// Garajım'da araç kartının altında: "Bu aracı takasa açmak için ne eksik?".
// Önceden yalnızca soluk gri tek bir cümle vardı (neyin eksik olduğunu ve ne
// yapılacağını söylemiyor, tıklanabilir hiçbir şey sunmuyordu). Şimdi sıradaki
// adım + tek bir buton + açılır adım listesi gösterir. Hook/durum yok (sunucu
// ve istemci bileşenlerinden güvenle kullanılabilir).

const ADIM_ETIKETI: Record<TakasAdimKodu, string> = {
  GARAJDA: "Araç garajınızda",
  YORUM: "Bu araç için yorumunuz yayında",
  FOTOGRAF: "Yorumunuzda fotoğraf yayında",
};

export function TakasSartKarti({
  adimlar,
  sonraki,
  className = "mt-3",
}: {
  adimlar: { kod: TakasAdimKodu; tamam: boolean }[];
  sonraki: TakasSonrakiAdim;
  /** Dış boşluk (varsayılan: Garajım kartının altı). */
  className?: string;
}) {
  return (
    <div className={`${className} border border-gray-100 bg-gray-50 rounded-xl p-3 overflow-hidden`}>
      <p className="text-sm font-semibold text-gray-800">
        <span aria-hidden="true">🔄 </span>
        {sonraki.baslik}
      </p>
      <p className="mt-1 text-xs text-gray-600">{sonraki.metin}</p>

      {sonraki.buton && (
        <Link
          href={sonraki.buton.href}
          className="mt-2.5 flex items-center justify-center min-h-11 px-4 rounded-xl text-sm font-semibold text-white"
          style={{ background: "var(--btn-dark)" }}
        >
          {sonraki.buton.etiket}
        </Link>
      )}

      <details className="mt-2.5 group">
        <summary className="cursor-pointer text-xs font-semibold text-link hover:underline list-none flex items-center gap-1 min-h-8">
          Adımları göster
          <span aria-hidden="true" className="transition-transform group-open:rotate-90">›</span>
        </summary>
        <ul className="mt-2 space-y-1.5">
          {adimlar.map((a) => (
            <li key={a.kod} className="flex items-start gap-2 text-xs text-gray-700 min-w-0">
              <span aria-hidden="true" className={`shrink-0 ${a.tamam ? "text-green-700" : "text-gray-400"}`}>
                {a.tamam ? "✓" : "○"}
              </span>
              <span className="min-w-0 break-words">
                {ADIM_ETIKETI[a.kod]}
                <span className="sr-only">{a.tamam ? ": tamamlandı" : ": bekliyor"}</span>
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-xs text-gray-600">
          Yorumunuza eklediğiniz fotoğraf, ilan sayfasında aracınızı karşı tarafa gösterir; takas edeceği aracı görebilmesi gerekir.
        </p>
      </details>
    </div>
  );
}
