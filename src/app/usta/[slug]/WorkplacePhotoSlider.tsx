"use client";

import { useRef, useState } from "react";
import { WorkplacePhotoReportButton } from "./WorkplacePhotoReportButton";

export interface WorkplacePhoto {
  id: number;
  url: string;
}

// Usta profilinde kimlik kartı ile Uzmanlık Alanları arasında gösterilen
// çalışma yeri fotoğrafları — tabela her zaman ilk kare (çağıran taraf
// sıralıyor), sonra iç mekan. Elle kaydırma birincil etkileşim (scroll-snap),
// otomatik geçiş YOK — 3 ajanlı UX planının kararı: tek fotoğrafta mekanizma
// hiç devreye girmesin, çoklu fotoğrafta alt ortada nokta göstergesi +
// masaüstünde hover'da ok butonları. Fotoğrafa tıklanınca tam ekran büyütme
// (lightbox) açılır — kullanıcı fotoğrafları büyütemediğini fark etti.
// "Bildir" butonu SU AN GÖRÜNEN (active) fotoğrafı referans alır ve hangi
// fotoğrafın bildirildiğini netleştirmek için "(2/3)" gibi bir sıra
// gösterir — kullanıcı çoklu fotoğrafta bunun belirsiz olduğunu fark etti.
export function WorkplacePhotoSlider({ photos }: { photos: WorkplacePhoto[] }) {
  const [active, setActive] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);

  if (photos.length === 0) return null;

  function scrollTo(index: number) {
    const track = trackRef.current;
    const clamped = Math.max(0, Math.min(photos.length - 1, index));
    if (track) track.scrollTo({ left: clamped * track.clientWidth, behavior: "smooth" });
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
              <img
                src={p.url}
                alt="Çalışma yeri fotoğrafı"
                className="w-full h-full object-cover cursor-zoom-in"
                onClick={() => setLightboxOpen(true)}
              />
            </div>
          ))}
        </div>

        {/* Büyütme ipucu — kullanıcı fotoğrafın büyütülemediğini fark etti,
            artık tıklanınca tam ekran açılıyor; köşedeki rozet bunu belli eder. */}
        <div className="pointer-events-none absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded-full bg-black/50 text-white text-[10px] font-semibold">
          <span aria-hidden="true">🔍</span> Büyütmek için dokunun
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

      {/* Merkezde — önceden sağa dayalıydı, hangi fotoğrafın bildirildiği
          belirsizdi (kullanıcı fark etti). Artık ortada ve birden fazla
          fotoğraf varsa sırasını da gösteriyor. */}
      <div className="mt-1.5 px-1 flex justify-center">
        <WorkplacePhotoReportButton
          photoId={photos[active].id}
          photoIndex={active}
          photoCount={photos.length}
        />
      </div>

      {lightboxOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 px-4 py-6"
          onClick={() => setLightboxOpen(false)}
        >
          <button
            type="button"
            onClick={() => setLightboxOpen(false)}
            aria-label="Kapat"
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors"
          >
            ✕
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photos[active].url}
            alt="Çalışma yeri fotoğrafı — büyütülmüş"
            className="max-w-full max-h-full object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
          {photos.length > 1 && (
            <>
              {active > 0 && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); scrollTo(active - 1); }}
                  aria-label="Önceki fotoğraf"
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors"
                >
                  ‹
                </button>
              )}
              {active < photos.length - 1 && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); scrollTo(active + 1); }}
                  aria-label="Sonraki fotoğraf"
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors"
                >
                  ›
                </button>
              )}
              <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-xs font-semibold">
                {active + 1} / {photos.length}
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
