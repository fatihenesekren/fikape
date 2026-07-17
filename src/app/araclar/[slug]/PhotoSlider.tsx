"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { PhotoProvider, PhotoView } from "react-photo-view";
import "react-photo-view/dist/react-photo-view.css";

interface Photo {
  url: string;
  label?: string; // örn. "Kullanıcı fotoğrafı"
}

interface Props {
  photos: Photo[];
  alt: string;
}

// Zoom in/out için +/- butonları sadece fare/touchpad kullanıcılarına
// (masaüstü) gösterilir — mobilde pinch + çift dokunuş zaten yeterli ve
// daha doğal, küçük dokunma hedefleri eklemek gereksiz sürtünme yaratır
// (bkz. UX danışmanlığı: fikape_foto_zoom_ux.md).
function useIsFinePointer() {
  const [isFine, setIsFine] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(pointer: fine)").matches
  );
  useEffect(() => {
    const mq = window.matchMedia("(pointer: fine)");
    const handler = (e: MediaQueryListEvent) => setIsFine(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return isFine;
}

function ZoomToolbar({ scale, onScale }: { scale: number; onScale: (scale: number) => void }) {
  const isFinePointer = useIsFinePointer();
  if (!isFinePointer) return null;
  return (
    <>
      <button
        className="PhotoView-Slider__toolbarIcon"
        aria-label="Uzaklaştır"
        onClick={() => onScale(Math.max(1, scale - 0.5))}
      >
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
          <line x1="8" y1="11" x2="14" y2="11" />
        </svg>
      </button>
      <button
        className="PhotoView-Slider__toolbarIcon"
        aria-label="Yakınlaştır"
        onClick={() => onScale(scale + 0.5)}
      >
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
          <line x1="11" y1="8" x2="11" y2="14" />
          <line x1="8" y1="11" x2="14" y2="11" />
        </svg>
      </button>
    </>
  );
}

function SliderFrame({ photo, alt, index }: { photo: Photo; alt: string; index: number }) {
  return (
    <div className="relative w-full h-64 sm:h-80 rounded-2xl overflow-hidden">
      {/* Blur arka plan */}
      <Image
        src={photo.url}
        alt=""
        aria-hidden="true"
        fill
        sizes="(max-width: 1024px) 100vw, 1024px"
        className="object-cover scale-110 blur-xl opacity-60"
      />
      <div className="absolute inset-0 bg-black/20" />
      {/* Asıl fotoğraf */}
      <Image
        src={photo.url}
        alt={index === 0 ? alt : `${alt} fotoğraf ${index + 1}`}
        fill
        sizes="(max-width: 1024px) 100vw, 1024px"
        className="object-contain"
      />
      {/* Tıklanınca/dokununca büyütülmüş, zoom'lanabilir görünüm açan görünmez katman */}
      <PhotoView src={photo.url}>
        <div className="absolute inset-0 cursor-zoom-in" role="button" aria-label="Fotoğrafı büyüt" />
      </PhotoView>
      {/* Kaynak badge */}
      {photo.label && (
        <div className="absolute bottom-3 left-3 px-2 py-0.5 rounded-full bg-black/50 text-white text-xs font-medium z-10">
          📸 {photo.label}
        </div>
      )}
    </div>
  );
}

export function PhotoSlider({ photos, alt }: Props) {
  const [current, setCurrent] = useState(0);

  if (photos.length === 0) return null;

  if (photos.length === 1) {
    return (
      <PhotoProvider toolbarRender={({ scale, onScale }) => <ZoomToolbar scale={scale} onScale={onScale} />}>
        <div className="w-full bg-gray-50 border-b border-gray-100">
          <div className="max-w-5xl mx-auto px-4 py-4">
            <SliderFrame photo={photos[0]} alt={alt} index={0} />
          </div>
        </div>
      </PhotoProvider>
    );
  }

  const prev = () => setCurrent((c) => (c - 1 + photos.length) % photos.length);
  const next = () => setCurrent((c) => (c + 1) % photos.length);
  const showThumbs = photos.length >= 3;

  return (
    <PhotoProvider toolbarRender={({ scale, onScale }) => <ZoomToolbar scale={scale} onScale={onScale} />}>
      <div className="w-full bg-gray-50 border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 py-4 space-y-3">
          {/* Ana kare */}
          <div className="relative w-full h-64 sm:h-80 rounded-2xl overflow-hidden group">
            {photos.map((photo, i) => (
              <div
                key={i}
                className={`absolute inset-0 transition-opacity duration-300 ${
                  i === current ? "opacity-100" : "opacity-0 pointer-events-none"
                }`}
              >
                {/* Blur arka plan */}
                <Image
                  src={photo.url}
                  alt=""
                  aria-hidden="true"
                  fill
                  sizes="(max-width: 1024px) 100vw, 1024px"
                  className="object-cover scale-110 blur-xl opacity-60"
                />
                <div className="absolute inset-0 bg-black/20" />
                {/* Asıl fotoğraf */}
                <Image
                  src={photo.url}
                  alt={i === 0 ? alt : `${alt} fotoğraf ${i + 1}`}
                  fill
                  sizes="(max-width: 1024px) 100vw, 1024px"
                  className="object-contain"
                />
                {/* Tıklanınca/dokununca büyütülmüş, zoom'lanabilir görünüm açan görünmez katman */}
                <PhotoView src={photo.url}>
                  <div className="absolute inset-0 cursor-zoom-in" role="button" aria-label="Fotoğrafı büyüt" />
                </PhotoView>
                {/* Kaynak badge */}
                {photo.label && (
                  <div className="absolute bottom-3 left-3 px-2 py-0.5 rounded-full bg-black/50 text-white text-xs font-medium z-10">
                    📸 {photo.label}
                  </div>
                )}
              </div>
            ))}

            {/* Sol ok */}
            <button
              onClick={prev}
              aria-label="Önceki fotoğraf"
              className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/60 z-10"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>

            {/* Sağ ok */}
            <button
              onClick={next}
              aria-label="Sonraki fotoğraf"
              className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/60 z-10"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>

            {/* Sayaç */}
            <div className="absolute bottom-3 right-3 px-2 py-0.5 rounded-full bg-black/50 text-white text-xs font-medium z-10">
              {current + 1} / {photos.length}
            </div>
          </div>

          {/* Thumbnail şeridi (3+ fotoğraf) veya dot indikatörler */}
          {showThumbs ? (
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {photos.map((photo, i) => (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  aria-label={`Fotoğraf ${i + 1}`}
                  className={`relative shrink-0 w-16 h-12 rounded-lg overflow-hidden transition-all ${
                    i === current
                      ? "ring-2 ring-gray-700 ring-offset-1"
                      : "opacity-60 hover:opacity-90"
                  }`}
                >
                  <Image
                    src={photo.url}
                    alt={`Fotoğraf ${i + 1}`}
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          ) : (
            <div className="flex justify-center gap-1.5">
              {photos.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  aria-label={`Fotoğraf ${i + 1}`}
                  className={`rounded-full transition-all ${
                    i === current
                      ? "w-5 h-1.5 bg-gray-700"
                      : "w-1.5 h-1.5 bg-gray-300 hover:bg-gray-400"
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </PhotoProvider>
  );
}
