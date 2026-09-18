"use client";

import { useEffect, useRef, useState } from "react";

interface Item {
  slug: string;
  name: string;
  overall: number | null;
}

// Ana araç kartları scroll ile ekrandan çıkınca (spec tablosu/AI özeti uzun
// olabildiği için) kullanıcı hangi sütunun hangi araç olduğunu kaybetmesin diye
// üstte sabitlenen kısa bir isim+skor şeridi. Sentinel + IntersectionObserver:
// CSS `position: sticky` tek başına "şu an yapışık mı" bilgisini vermiyor, bu
// yüzden kartların hemen altına sıfır yükseklikli bir sentinel konup görünürlüğü
// izleniyor — sentinel görünmez olunca (kartlar yukarı kaydı) şerit açılıyor.
export function StickyCompareHeader({ items }: { items: Item[] }) {
  const [stuck, setStuck] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setStuck(!entry.isIntersecting),
      { rootMargin: "-57px 0px 0px 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <div ref={sentinelRef} />
      <div
        className={`sticky top-14 z-40 -mx-4 px-4 bg-white/95 backdrop-blur border-b border-gray-100 overflow-hidden transition-[max-height,opacity] duration-150 ${
          stuck ? "max-h-16 opacity-100 py-2.5" : "max-h-0 opacity-0 py-0"
        }`}
      >
        <div className="flex gap-5 overflow-x-auto">
          {items.map((it) => (
            <div key={it.slug} className="flex items-center gap-2 shrink-0">
              <span className="text-sm font-semibold text-gray-900 truncate max-w-[160px]">{it.name}</span>
              {it.overall != null && (
                <span className="text-xs font-black text-link">{it.overall.toFixed(1)}</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
