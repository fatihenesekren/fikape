"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface Props {
  children: React.ReactNode;
}

// Yatay kaydırmalı şeritlerde (Trend, Son Yorumlar) sağ kenar fade'i.
// Fade sadece sınırdaki kart "belirsiz" şekilde kesiliyorsa (çoğu görünür ama
// tam değil) gösterilir — kart zaten çok küçük bir dilim halinde görünüyorsa
// fade tamamen kapatılır, aksi halde küçük dilim fade altında "hayalet" gibi
// kayboluyor (bkz. gerçek üründe gözlemlenen bug).
export function ScrollFadeRow({ children }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showFade, setShowFade] = useState(false);

  const update = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const cards = el.querySelectorAll<HTMLElement>("[data-scroll-card]");
    const containerRight = el.getBoundingClientRect().right;

    let fade = false;
    cards.forEach((card) => {
      const rect = card.getBoundingClientRect();
      if (rect.width === 0) return;
      const visibleWidth = Math.max(0, Math.min(rect.right, containerRight) - rect.left);
      const fraction = visibleWidth / rect.width;
      // Kart %60-99 arası görünürse ("neredeyse tam ama kesik") fade göster
      if (fraction > 0.6 && fraction < 0.999) fade = true;
    });
    setShowFade(fade);
  }, []);

  useEffect(() => {
    update();
    const el = scrollRef.current;
    el?.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      el?.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [update]);

  return (
    <div className="relative">
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto scrollbar-none pb-2 snap-x snap-proximity"
      >
        {children}
        <div className="shrink-0 w-8" aria-hidden="true" />
      </div>
      {showFade && (
        <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-[#f8f9fa] to-transparent transition-opacity" />
      )}
    </div>
  );
}
