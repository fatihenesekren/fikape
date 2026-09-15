"use client";

import { useRef, useState } from "react";
import { WorkplacePhotoReportButton } from "./WorkplacePhotoReportButton";

export interface WorkplacePhoto {
  id: number;
  url: string;
}

// Usta profilinin EN BAŞINDA gösterilen çalışma yeri fotoğrafları — tabela
// her zaman ilk kare (çağıran taraf sıralıyor), sonra iç mekan. Elle
// kaydırma birincil etkileşim (scroll-snap), otomatik geçiş YOK — 3 ajanlı
// UX planının kararı: tek fotoğrafta mekanizma hiç devreye girmesin, çoklu
// fotoğrafta alt ortada nokta göstergesi + masaüstünde hover'da ok butonları.
// "Bildir" butonu SU AN GÖRÜNEN (active) fotoğrafı referans alır — bu yüzden
// slider'ın kendi state'ine ihtiyaç duyduğu için burada, sayfa bileşeninde değil.
export function WorkplacePhotoSlider({ photos }: { photos: WorkplacePhoto[] }) {
  const [active, setActive] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);

  if (photos.length === 0) return null;

  function scrollTo(index: number) {
    const track = trackRef.current;
    if (!track) return;
    const clamped = Math.max(0, Math.min(photos.length - 1, index));
    track.scrollTo({ left: clamped * track.clientWidth, behavior: "smooth" });
    setActive(clamped);
  }

  function handleScroll() {
    const track = trackRef.current;
    if (!track || track.clientWidth === 0) return;
    setActive(Math.round(track.scrollLeft / track.clientWidth));
  }

  return (
    <div className="mb-6">
      <div className="relative group">
        <div
          ref={trackRef}
          onScroll={handleScroll}
          className="flex overflow-x-auto snap-x snap-mandatory rounded-2xl border border-gray-100 bg-gray-50"
          style={{ scrollbarWidth: "none" }}
        >
          {photos.map((p) => (
            <div key={p.id} className="w-full shrink-0 snap-center aspect-video">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.url} alt="Çalışma yeri fotoğrafı" className="w-full h-full object-cover" />
            </div>
          ))}
        </div>

        {photos.length > 1 && (
          <>
            {/* Masaüstünde hover'da beliren ok butonları — mobilde swipe zaten yeterli. */}
            {active > 0 && (
              <button
                type="button"
                onClick={() => scrollTo(active - 1)}
                aria-label="Önceki fotoğraf"
                className="hidden sm:flex opacity-0 group-hover:opacity-100 transition-opacity absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 border border-gray-100 items-center justify-center text-gray-600 hover:text-gray-900 shadow-sm"
              >
                ‹
              </button>
            )}
            {active < photos.length - 1 && (
              <button
                type="button"
                onClick={() => scrollTo(active + 1)}
                aria-label="Sonraki fotoğraf"
                className="hidden sm:flex opacity-0 group-hover:opacity-100 transition-opacity absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 border border-gray-100 items-center justify-center text-gray-600 hover:text-gray-900 shadow-sm"
              >
                ›
              </button>
            )}

            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
              {photos.map((p, i) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => scrollTo(i)}
                  aria-label={`${i + 1}. fotoğrafa git`}
                  className={`w-1.5 h-1.5 rounded-full transition-colors ${i === active ? "bg-white" : "bg-white/50"}`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <div className="mt-1.5 px-1">
        <WorkplacePhotoReportButton photoId={photos[active].id} />
      </div>
    </div>
  );
}
