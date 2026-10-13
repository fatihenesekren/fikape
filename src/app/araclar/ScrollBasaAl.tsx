"use client";

import { useEffect } from "react";

// Ana sayfadaki "Tüm araçlara göz atın" düğmesi (_components/TumAraclarCta.tsx) tıklandığında bir işaret bırakır;
// katalog açılınca sayfa en üste alınır. Bazı tarayıcılarda ana sayfanın derin kaydırma konumu korunuyor ve katalog
// sayfasının en altına düşülüyordu. İşaret yalnızca o düğmeyle konur: geri/ileri gezinmedeki kaydırma geri yüklemesi
// ve filtre değişiklikleri (kaydırma korunur) etkilenmez.
export const KATALOG_BASA_AL_ANAHTARI = "fikape:katalog-basa-al";

export function ScrollBasaAl() {
  useEffect(() => {
    let isaretli = false;
    try {
      isaretli = sessionStorage.getItem(KATALOG_BASA_AL_ANAHTARI) === "1";
      if (isaretli) sessionStorage.removeItem(KATALOG_BASA_AL_ANAHTARI);
    } catch {
      return; // depolama kapalı: varsayılan davranış
    }
    if (!isaretli) return;
    // Sayfa akışla (Suspense) büyüyebilir: hemen ve bir sonraki iki karede üste alınır.
    window.scrollTo(0, 0);
    const id1 = requestAnimationFrame(() => {
      window.scrollTo(0, 0);
      requestAnimationFrame(() => window.scrollTo(0, 0));
    });
    return () => cancelAnimationFrame(id1);
  }, []);
  return null;
}
