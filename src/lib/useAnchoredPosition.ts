"use client";

import { useLayoutEffect, useState, type CSSProperties, type RefObject } from "react";

// Header'daki dropdown panelleri (hesap menüsü, mesaj/bildirim önizlemesi)
// daha önce hep CSS tahminiyle konumlanıyordu (absolute right-0, sonra
// fixed right-4, sonra header'ın max-w-7xl kenarını hesaplayan calc()) —
// her biri BİR senaryoda kırıldı, çünkü hiçbiri butonun GERÇEK konumunu
// bilmiyordu: tetikleyici header'daki ikon kümesinin neresinde olursa
// olsun panel hep "tahmini" bir köşeye sabitleniyordu (son halinde bu,
// tıklanan butondan tamamen farklı bir butonun altında görünmesine yol
// açtı — kullanıcı gösterdi). Bu hook, tetikleyicinin gerçek
// getBoundingClientRect()'ini ölçüp paneli ONA göre (sol kenarı
// tetikleyicinin sol kenarıyla hizalı — kullanıcı isteği: "ikonun
// başlangıç konumundan başlasın") konumlandırıyor, ardından viewport
// dışına taşmayacak şekilde kırpıyor (Popper/Floating-UI'daki
// "anchor + collision" fikrinin hafif bir versiyonu).
export function useAnchoredPosition(
  triggerRef: RefObject<HTMLElement | null>,
  open: boolean,
  panelWidth: number,
): CSSProperties {
  const [style, setStyle] = useState<CSSProperties>({ visibility: "hidden" });

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return;

    function position() {
      if (!triggerRef.current) return;
      const margin = 16;
      const width = Math.min(panelWidth, window.innerWidth - margin * 2);

      // Mobilde (sm altı, <640px) burada zaten sorun yoktu (kullanıcı: "mobil
      // aynı kalsın") — üç panel de (zil/mesaj/hesap) her zaman aynı sağ
      // kenara sabitti (right-4 top-16), dokunmuyoruz.
      if (window.innerWidth < 640) {
        setStyle({ position: "fixed", top: 64, right: margin, width });
        return;
      }

      // sm ve üstünde: panelin SOL kenarı, tetikleyicinin sol kenarıyla
      // hizalanır (kullanıcı isteği: "ikonun başlangıç konumundan başlasın")
      // — sadece panel sağdan taşacaksa sola kaydırılır.
      const rect = triggerRef.current.getBoundingClientRect();
      const left = Math.max(margin, Math.min(rect.left, window.innerWidth - width - margin));
      setStyle({ position: "fixed", top: rect.bottom + 8, left, width });
    }

    // Panel açılır açılmaz tek bir ölçüm (hatta bir sonraki animasyon
    // karesinde bile) bazen YANLIŞ değerler veriyordu — tetikleyicinin
    // getBoundingClientRect()'i, header'ın (position: sticky) layout'u tam
    // oturmadan önceki bir anı yakalayabiliyordu (gerçek tarayıcıda tekrar
    // tekrar ölçülüp doğrulandı: panel butondan tamamen kopuk bir yerde
    // görünüyordu, sonraki bir ölçümde ise doğru çıkıyordu). Tek noktalı bir
    // ölçüm yerine kısa bir "kendini düzeltme" serisi (hemen + rAF + 50ms +
    // 150ms) kullanıyoruz — hangi anda layout otururesa otursun panel en
    // geç ~150ms içinde doğru yere kayıyor, kullanıcı fark etmiyor.
    position();
    const raf = requestAnimationFrame(position);
    const t1 = setTimeout(position, 50);
    const t2 = setTimeout(position, 150);
    window.addEventListener("resize", position);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(t1);
      clearTimeout(t2);
      window.removeEventListener("resize", position);
    };
  }, [open, triggerRef, panelWidth]);

  return style;
}
