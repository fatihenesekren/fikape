"use client";

import { useLayoutEffect, useRef, useState } from "react";

// Kart yükseklikleri değişken (bazılarında "Hızlı puandın" rozeti, foto,
// uzun açıklama vb. var) — bu yüzden sabit piksel maxHeight kart sınırına
// asla tam oturmuyordu (kullanıcı: "3. kartın yarısı gözükür yarısı
// gözükmeyecek şekilde olmasın"). Artık gerçek DOM'dan, visibleCount'ıncı
// kartın alt sınırını ölçüp maxHeight'ı ona göre kesin olarak ayarlıyoruz —
// kart her zaman ya tam görünür ya da hiç görünmez, asla yarım kesilmez.
export function ScrollFadeBox({
  children,
  itemCount,
  visibleCount = 4,
  alwaysFramed = false,
}: {
  children: React.ReactNode;
  itemCount: number;
  visibleCount?: number;
  alwaysFramed?: boolean;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [maxHeight, setMaxHeight] = useState<number | undefined>(undefined);

  const needsFrame = alwaysFramed || itemCount > visibleCount;

  useLayoutEffect(() => {
    if (!needsFrame) return;
    const scrollEl = scrollRef.current;
    const list = scrollEl?.firstElementChild;
    if (!scrollEl || !list) return;

    function measure() {
      if (!scrollEl || !list) return;
      const items = list.children;
      const targetItem = items[visibleCount - 1] ?? items[items.length - 1];
      if (!targetItem) return;
      const containerRect = scrollEl.getBoundingClientRect();
      const itemRect = targetItem.getBoundingClientRect();
      setMaxHeight(Math.ceil(itemRect.bottom - containerRect.top));
    }

    measure();

    const ro = new ResizeObserver(measure);
    ro.observe(list);
    return () => ro.disconnect();
  }, [needsFrame, visibleCount, itemCount]);

  if (!needsFrame) {
    return <>{children}</>;
  }

  return (
    <div className="border border-gray-100 rounded-2xl p-3 bg-gray-50/40">
      <div
        ref={scrollRef}
        className="overflow-y-auto pr-1 -mr-1"
        style={{
          maxHeight,
          WebkitOverflowScrolling: "touch",
          maskImage: maxHeight != null ? "linear-gradient(to bottom, black calc(100% - 28px), transparent 100%)" : undefined,
          WebkitMaskImage: maxHeight != null ? "linear-gradient(to bottom, black calc(100% - 28px), transparent 100%)" : undefined,
        }}
      >
        {children}
      </div>
    </div>
  );
}
