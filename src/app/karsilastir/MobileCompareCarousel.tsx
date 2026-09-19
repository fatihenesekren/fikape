"use client";

import { useEffect, useRef, useState } from "react";
import type { CompareProductView } from "./CompareResultsGrid";
import type { SpecComparisonRow } from "@/lib/compare/buildSpecComparisonRows";
import { MobileVehicleCard } from "./MobileVehicleCard";

// 3 uzman ajan (UX, teknik fizibilite, görsel tasarım) sonrası kararlaştırılan
// mobil mimari: masaüstündeki TEK tablo (UnifiedCompareTable, çok sütun yan
// yana) mobilde ARTIK KULLANILMIYOR — 3-4 araçlı mobil karşılaştırmada sütun
// genişliği fiziksel olarak yetersiz kalıyordu (AI özeti okunamaz hale
// geliyordu, table-fixed+minWidth+overflow-x-auto kombinasyonu da dikey sayfa
// kaydırması sırasında istemsiz yatay kaymaya yol açıyordu — teknik ajan
// native <table> içinde CSS scroll-snap'in <td> seviyesinde MÜMKÜN OLMADIĞINI
// doğruladı, çünkü <td> scroll container'ın doğrudan çocuğu değil).
//
// Çözüm: mobilde tablo yapısından tamamen çıkılıp her araç TAM GENİŞLİK,
// bağımsız bir <div> kart oluyor (MobileVehicleCard) — artık gerçek DOM
// kardeşler oldukları için scroll-snap-x sorunsuz çalışıyor, "yarım kesik"
// takılma riski yapısal olarak ortadan kalkıyor. Kullanıcı araçlar arasında
// swipe + nokta göstergesiyle geçiyor (Google Flights/Airbnb mobil
// karşılaştırma deseni). Masaüstü (md ve üstü) mevcut UnifiedCompareTable
// DEĞİŞMEDEN kalıyor — bu bileşen sadece mobilde (md altı) render ediliyor.
export function MobileCompareCarousel({
  products,
  specRows,
}: {
  products: CompareProductView[];
  specRows: SpecComparisonRow[];
}) {
  const [active, setActive] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    function onScroll() {
      if (!el) return;
      const cardWidth = el.clientWidth;
      if (cardWidth === 0) return;
      const idx = Math.round(el.scrollLeft / cardWidth);
      setActive(Math.max(0, Math.min(idx, products.length - 1)));
    }
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [products.length]);

  function goTo(i: number) {
    const el = containerRef.current;
    if (!el) return;
    el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
  }

  return (
    <div className="md:hidden">
      <div className="flex flex-wrap justify-center items-center gap-x-3 gap-y-1 text-[11px] text-gray-500 mb-3">
        <span>✓ En iyi değer</span>
        <span>△ Farklı — tercihine bağlı</span>
      </div>
      <div className="flex items-center justify-center gap-1.5 mb-3">
        {products.map((p, i) => (
          <button
            key={p.slug}
            onClick={() => goTo(i)}
            aria-label={`${p.brandName} ${p.fullLabel} kartına git`}
            aria-current={i === active}
            className={`h-1.5 rounded-full transition-all ${i === active ? "w-6 bg-gray-900" : "w-1.5 bg-gray-300"}`}
          />
        ))}
      </div>
      <div
        ref={containerRef}
        className="flex overflow-x-auto snap-x snap-mandatory -mx-4 px-4 gap-4"
        style={{ scrollbarWidth: "none" }}
      >
        {products.map((p, i) => (
          <div key={p.slug} className="snap-center shrink-0 w-full">
            <MobileVehicleCard product={p} index={i} specRows={specRows} />
          </div>
        ))}
      </div>
      <p className="text-center text-xs text-gray-400 mt-2">
        {active + 1} / {products.length} — kaydırarak diğer araçları gör
      </p>
    </div>
  );
}
