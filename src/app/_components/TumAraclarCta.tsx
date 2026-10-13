import Link from "next/link";
import { Suspense } from "react";
import { getAktifAracSayisi } from "@/lib/aracSayisi";

// Ana sayfa: öne çıkan araç gridinin altında kataloğa geçiş çağrısı. Önceden gridin altında, sol hizalı,
// küçük mavi bir "Tüm araçlar →" bağlantısıydı (~20px yüksekliğinde, fark edilmiyordu). Şimdi ortalanmış,
// 48px yüksekliğinde belirgin bir düğme + dürüst bir katalog sayısı. Düğme ikincil stilde (siyah kenarlık,
// üzerine gelince dolar): ana eylem Araç Bul'daki siyah düğme kalsın, üst bantlarla yarışmasın.
// Sayı alınamazsa (veritabanı hatası) sayısız metne düşer; sayfa akışını bloklamaz (Suspense).
function Cta({ sayi }: { sayi: number | null }) {
  return (
    <div className="w-full max-w-7xl mx-auto px-4 pt-2 pb-10 flex flex-col items-center gap-3 text-center">
      <p className="text-sm text-gray-500">
        {sayi != null && sayi > 0
          ? `Yukarıda öne çıkanları görüyorsunuz. Katalogda toplam ${sayi.toLocaleString("tr-TR")} araç var.`
          : "Aradığınız araç burada yoksa tüm kataloğa göz atabilirsiniz."}
      </p>
      <Link
        href="/araclar"
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

async function SayiliCta() {
  const sayi = await getAktifAracSayisi().catch(() => null);
  return <Cta sayi={sayi} />;
}

export function TumAraclarCta() {
  return (
    <Suspense fallback={<Cta sayi={null} />}>
      <SayiliCta />
    </Suspense>
  );
}
