"use client";

import Link from "next/link";
import { KATALOG_BASA_AL_ANAHTARI } from "@/app/araclar/ScrollBasaAl";

// Ana sayfa: öne çıkan araç gridinin altında kataloğa geçiş çağrısı. Önceden gridin altında, sol hizalı, küçük
// mavi bir "Tüm araçlar →" bağlantısıydı (~20px yüksekliğinde, fark edilmiyordu). Şimdi ortalanmış, 48px
// yüksekliğinde belirgin bir düğme; ikincil stilde (siyah kenarlık, üzerine gelince dolar): ana eylem Araç Bul'daki
// siyah düğme kalsın, üst bantlarla yarışmasın.
//
// Katalog sayısı BİLEREK gösterilmiyor (3 ajanlı karar): gridin çoğu kartında "Henüz yorum yok" varken "318 araç"
// katalogu boş gösteriyor, sitenin kendi kuralı da küçük rakamı göstermemek (hero istatistikleri bu yüzden kaldırıldı).
// Metin, sayı yerine somut bir fayda söylüyor.
//
// Arama sayfasının boş ekranı da aynı bileşeni kullanır (metin ve dış boşluk prop ile verilir): iki yerde aynı düğme.
export function TumAraclarCta({
  aciklama = "Aradığınız araç burada yoksa kataloğun tamamına göz atabilirsiniz.",
  className = "w-full max-w-7xl mx-auto px-4 pt-2 pb-10",
}: { aciklama?: string; className?: string } = {}) {
  return (
    <div className={`${className} flex flex-col items-center gap-3 text-center`}>
      <p className="text-sm text-gray-600">{aciklama}</p>
      <Link
        href="/araclar"
        onClick={() => {
          try {
            sessionStorage.setItem(KATALOG_BASA_AL_ANAHTARI, "1");
          } catch {
            // yok sayılır
          }
        }}
        className="group inline-flex items-center justify-center gap-2 min-h-12 px-7 rounded-full border-2 border-[var(--btn-dark)] bg-white text-sm font-bold text-[var(--btn-dark)] shadow-sm transition-colors hover:bg-[var(--btn-dark)] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
        style={{ outlineColor: "var(--link)" }}
      >
        Tüm araçlara göz atın
        <span
          aria-hidden="true"
          className="motion-safe:transition-transform motion-safe:group-hover:translate-x-0.5"
        >
          →
        </span>
      </Link>
    </div>
  );
}
