"use client";

import { useRef, useState } from "react";
import { WorkplacePhotoReportButton } from "./WorkplacePhotoReportButton";

export interface WorkplacePhoto {
  id: number;
  url: string;
}

const SWIPE_THRESHOLD = 50;

// Usta profilinde kimlik kartı ile Uzmanlık Alanları arasında gösterilen
// çalışma yeri fotoğrafları — tabela her zaman ilk kare (çağıran taraf
// sıralıyor), sonra iç mekan. Önceden native scroll-snap kullanıyordu,
// kullanıcı "modern slider yapısına uygun olsun" dedi — artık transform
// tabanlı (translateX), sürükle-bırak (drag) destekli klasik carousel
// deseni: parmakla/mouse ile sürüklerken anlık takip eder, bırakınca eşiği
// geçtiyse bir sonraki/önceki kareye kayar, geçmediyse yumuşakça geri döner.
// Otomatik geçiş YOK — 3 ajanlı UX planının kararı: tek fotoğrafta mekanizma
// hiç devreye girmesin. Fotoğrafa tıklanınca tam ekran lightbox açılır.
// "Bildir" butonu SU AN GÖRÜNEN (active) fotoğrafı referans alır ve
// birden fazla fotoğrafta hangi fotoğrafın bildirildiğini "(2/3)" şeklinde
// gösterir.
export function WorkplacePhotoSlider({ photos }: { photos: WorkplacePhoto[] }) {
  const [active, setActive] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [dragging, setDragging] = useState(false);
  const dragStartX = useRef(0);
  const trackWidth = useRef(0);
  const trackEl = useRef<HTMLDivElement>(null);

  if (photos.length === 0) return null;

  function goTo(index: number) {
    setActive(Math.max(0, Math.min(photos.length - 1, index)));
  }

  function dragStart(clientX: number) {
    dragStartX.current = clientX;
    trackWidth.current = trackEl.current?.clientWidth || 1;
    setDragging(true);
  }

  function dragMove(clientX: number) {
    if (!dragging) return;
    let delta = clientX - dragStartX.current;
    // Uçlarda direnç — ilk/son karede daha fazla çekmek gerekiyor hissi verir.
    if ((active === 0 && delta > 0) || (active === photos.length - 1 && delta < 0)) {
      delta *= 0.35;
    }
    setDragOffset(delta);
  }

  function dragEnd() {
    if (!dragging) return;
    if (dragOffset < -SWIPE_THRESHOLD) goTo(active + 1);
    else if (dragOffset > SWIPE_THRESHOLD) goTo(active - 1);
    setDragging(false);
    setDragOffset(0);
  }

  return (
    <div className="mb-6">
      <div className="relative group">
        <div
          ref={trackEl}
          className="overflow-hidden rounded-2xl border border-gray-100 bg-gray-50 select-none"
        >
          <div
            className="flex"
            style={{
              transform: `translateX(calc(${-active * 100}% + ${dragging ? dragOffset : 0}px))`,
              transition: dragging ? "none" : "transform 350ms cubic-bezier(0.22, 1, 0.36, 1)",
            }}
            onTouchStart={(e) => dragStart(e.touches[0].clientX)}
            onTouchMove={(e) => dragMove(e.touches[0].clientX)}
            onTouchEnd={dragEnd}
            onMouseDown={(e) => dragStart(e.clientX)}
            onMouseMove={(e) => dragMove(e.clientX)}
            onMouseUp={dragEnd}
            onMouseLeave={dragEnd}
          >
            {photos.map((p) => (
              <div
                key={p.id}
                className="relative w-full shrink-0 aspect-video overflow-hidden bg-gray-900"
                style={{ cursor: dragging ? "grabbing" : "grab" }}
              >
                {/* object-cover dikey/dar kadrajlı fotoğraflarda tabelayı/üst
                    kısmı kırpıp kötü görünüyordu (kullanıcı fark etti).
                    Bulanık bir arka plan katmanıyla kareyi doldurup asıl
                    fotoğrafı hiç kırpmadan (object-contain) ortalıyoruz —
                    modern uygulamaların (Instagram, YouTube vb.) kullandığı
                    "letterbox" deseni. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.url}
                  alt=""
                  aria-hidden="true"
                  draggable={false}
                  className="absolute inset-0 w-full h-full object-cover scale-110 blur-2xl opacity-50"
                />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.url}
                  alt="Çalışma yeri fotoğrafı"
                  draggable={false}
                  className="relative w-full h-full object-contain cursor-zoom-in"
                  onClick={() => !dragging && setLightboxOpen(true)}
                />
              </div>
            ))}
          </div>
        </div>

        {photos.length > 1 && (
          <>
            {/* Masaüstünde hover'da beliren ok butonları — mobilde swipe zaten yeterli. */}
            {active > 0 && (
              <button
                type="button"
                onClick={() => goTo(active - 1)}
                aria-label="Önceki fotoğraf"
                className="hidden sm:flex opacity-0 group-hover:opacity-100 transition-opacity absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 border border-gray-100 items-center justify-center text-gray-600 hover:text-gray-900 shadow-sm"
              >
                ‹
              </button>
            )}
            {active < photos.length - 1 && (
              <button
                type="button"
                onClick={() => goTo(active + 1)}
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
                  onClick={() => goTo(i)}
                  aria-label={`${i + 1}. fotoğrafa git`}
                  className={`rounded-full transition-all ${i === active ? "w-4 h-1.5 bg-white" : "w-1.5 h-1.5 bg-white/50"}`}
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
                  onClick={(e) => { e.stopPropagation(); goTo(active - 1); }}
                  aria-label="Önceki fotoğraf"
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors"
                >
                  ‹
                </button>
              )}
              {active < photos.length - 1 && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); goTo(active + 1); }}
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
