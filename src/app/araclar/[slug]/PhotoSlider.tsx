"use client";

import { useState } from "react";
import Image from "next/image";

interface Photo {
  url: string;
  label?: string; // örn. "Kullanıcı fotoğrafı"
}

interface Props {
  photos: Photo[];
  alt: string;
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
      <div className="w-full bg-gray-50 border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <SliderFrame photo={photos[0]} alt={alt} index={0} />
        </div>
      </div>
    );
  }

  const prev = () => setCurrent((c) => (c - 1 + photos.length) % photos.length);
  const next = () => setCurrent((c) => (c + 1) % photos.length);
  const showThumbs = photos.length >= 3;

  return (
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
  );
}
