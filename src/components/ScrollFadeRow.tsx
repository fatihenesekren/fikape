"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface Props {
  children: React.ReactNode;
}

// Yatay kaydırmalı şeritlerde (Trend, Son Yorumlar) uç kart her zaman
// snap-mandatory ile tam hizalı durur (bkz. kartların kendi snap-start'ı) —
// bu yüzden fade artık sadece "daha fazla içerik var mı" sinyali, kesik kart
// durumunu maskelemeye çalışmıyor. Masaüstünde touch/swipe olmadığı için ok
// butonları da ekleniyor (mobilde dokunmatik zaten yeterli, oklar gizli).
export function ScrollFadeRow({ children }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const update = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
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

  const scrollByCard = (direction: 1 | -1) => {
    scrollRef.current?.scrollBy({ left: direction * 220, behavior: "smooth" });
  };

  return (
    <div className="relative">
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto scrollbar-none pb-2 snap-x snap-mandatory scroll-pr-8"
      >
        {children}
        <div className="shrink-0 w-8" aria-hidden="true" />
      </div>

      {canScrollLeft && (
        <div className="pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-[#f8f9fa] to-transparent" />
      )}
      {canScrollRight && (
        <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-[#f8f9fa] to-transparent" />
      )}

      {canScrollLeft && (
        <button
          type="button"
          aria-label="Geri kaydır"
          onClick={() => scrollByCard(-1)}
          className="hidden md:flex items-center justify-center absolute left-1 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white border border-gray-200 shadow-sm text-gray-500 hover:text-gray-900 hover:border-gray-300 transition-colors"
        >
          ‹
        </button>
      )}
      {canScrollRight && (
        <button
          type="button"
          aria-label="İleri kaydır"
          onClick={() => scrollByCard(1)}
          className="hidden md:flex items-center justify-center absolute right-1 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white border border-gray-200 shadow-sm text-gray-500 hover:text-gray-900 hover:border-gray-300 transition-colors"
        >
          ›
        </button>
      )}
    </div>
  );
}
