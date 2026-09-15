"use client";

import { useEffect, useRef, useState } from "react";
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
  const trackEl = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const groupRef = useRef<HTMLDivElement>(null);
  // Sürükleme küçük bir mesafeyi geçtiyse "bu bir tıklama değil, sürükleme"
  // demek — state (dragging) yerine ref kullanıyoruz çünkü mouseup'tan hemen
  // sonra tarayıcının doğal olarak ateşlediği click olayı, React'ın
  // dragging=false state güncellemesini ÇOKTAN uygulamış olabiliyor; bu da
  // her sürüklemenin sonunda yanlışlıkla lightbox'ı açıyordu (kullanıcı
  // fark etti — "sürükleyince hem kaydırıyor hem büyütüyor").
  const didDrag = useRef(false);
  // dragging/active'i pointer event handler'ları İÇİNDE de ref üzerinden takip
  // ediyoruz — state'e güvenmek (5 alanlı kod incelemesi bulgusu) art arda çok
  // hızlı gelen mousemove/touchmove olaylarında React henüz render etmeden
  // eski değeri okuma riski taşıyordu (goToRelative'daki closure hatasıyla
  // aynı aile). State sadece görsel/stil amaçlı kalmaya devam ediyor.
  const draggingRef = useRef(false);
  const activeRef = useRef(0);
  useEffect(() => { activeRef.current = active; }, [active]);

  function goTo(index: number) {
    setActive(Math.max(0, Math.min(photos.length - 1, index)));
  }

  // Bir önceki/sonraki kareye geçerken `active`'i doğrudan closure'dan okumak
  // yerine fonksiyonel güncelleme kullanıyoruz — art arda hızlı basılan ok
  // tuşlarında (veya otomasyon testinde) React henüz yeniden render etmeden
  // ikinci keydown eski `active` değerini okuyup aynı hedefe gidiyordu, bu da
  // ya bir kare atlanmış ya da hiç ilerlememiş gibi görünüyordu (kullanıcı
  // fark etti — "ortadaki fotoyu göstermiyor atlıyor").
  function goToRelative(delta: number) {
    setActive((prev) => Math.max(0, Math.min(photos.length - 1, prev + delta)));
  }

  function dragStart(clientX: number) {
    dragStartX.current = clientX;
    didDrag.current = false;
    draggingRef.current = true;
    setDragging(true);
  }

  function dragMove(clientX: number) {
    if (!draggingRef.current) return;
    let delta = clientX - dragStartX.current;
    if (Math.abs(delta) > 5) didDrag.current = true;
    // Uçlarda direnç — ilk/son karede daha fazla çekmek gerekiyor hissi verir.
    const a = activeRef.current;
    if ((a === 0 && delta > 0) || (a === photos.length - 1 && delta < 0)) {
      delta *= 0.35;
    }
    setDragOffset(delta);
  }

  function dragEnd() {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    setDragOffset((offset) => {
      if (offset < -SWIPE_THRESHOLD) goToRelative(1);
      else if (offset > SWIPE_THRESHOLD) goToRelative(-1);
      return 0;
    });
    setDragging(false);
  }

  function handlePhotoClick() {
    // Sürükleme sonrası tarayıcının ateşlediği "hayalet" click'i yut —
    // yukarıdaki didDrag açıklamasına bkz.
    if (didDrag.current) { didDrag.current = false; return; }
    setLightboxOpen(true);
  }

  // Klavye ile sağ/sol ok — kullanıcı fark etti, sadece dokunma/sürükleme
  // vardı. Slider'a odaklanınca (Tab ile veya tıklayarak) çalışır.
  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowLeft") { e.preventDefault(); goToRelative(-1); }
    else if (e.key === "ArrowRight") { e.preventDefault(); goToRelative(1); }
  }

  // Lightbox açıkken de aynı ok tuşları + Escape ile kapatma — modal
  // içindeyken beklenen standart davranış. Açılınca odak kapatma butonuna
  // taşınır, kapanınca tetikleyen fotoğrafa geri döner (a11y denetimi bulgusu
  // — odak yönetimi olmadan klavye/ekran okuyucu kullanıcısı modal kapanınca
  // odağı kaybediyordu).
  useEffect(() => {
    if (!lightboxOpen) return;
    const groupNode = groupRef.current;
    closeBtnRef.current?.focus();
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "ArrowLeft") goToRelative(-1);
      else if (e.key === "ArrowRight") goToRelative(1);
      else if (e.key === "Escape") setLightboxOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      groupNode?.focus();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lightboxOpen, photos.length]);

  if (photos.length === 0) return null;

  return (
    <div className="mb-6">
      <div
        ref={groupRef}
        className="relative group rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-400"
        tabIndex={0}
        role="group"
        aria-roledescription="carousel"
        aria-label="Çalışma yeri fotoğrafları"
        onKeyDown={handleKeyDown}
      >
        <div
          ref={trackEl}
          className="overflow-hidden rounded-2xl border border-gray-100 bg-gray-50 select-none"
        >
          <div
            className="flex"
            style={{
              transform: `translateX(calc(${-active * 100}% + ${dragging ? dragOffset : 0}px))`,
              transition: dragging ? "none" : "transform 350ms cubic-bezier(0.22, 1, 0.36, 1)",
              touchAction: "pan-y",
            }}
            onTouchStart={(e) => dragStart(e.touches[0].clientX)}
            onTouchMove={(e) => dragMove(e.touches[0].clientX)}
            onTouchEnd={dragEnd}
            onMouseDown={(e) => dragStart(e.clientX)}
            onMouseMove={(e) => dragMove(e.clientX)}
            onMouseUp={dragEnd}
            onMouseLeave={dragEnd}
          >
            {photos.map((p, i) => (
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
                    "letterbox" deseni. Ağır `blur-2xl` filtresi yalnızca
                    görünen kare ve komşularında render edilir — mobil
                    performans bulgusu: tüm kareler aynı anda bulanıklaştırılırsa
                    çok sayıda fotoğrafta GPU'yu gereksiz zorluyordu. */}
                {Math.abs(i - active) <= 1 && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={p.url}
                    alt=""
                    aria-hidden="true"
                    draggable={false}
                    loading="lazy"
                    className="absolute inset-0 w-full h-full object-cover scale-110 blur-2xl opacity-50"
                  />
                )}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.url}
                  alt={`Çalışma yeri fotoğrafı ${i + 1}/${photos.length}`}
                  draggable={false}
                  loading={i === 0 ? undefined : "lazy"}
                  className="relative w-full h-full object-contain cursor-zoom-in"
                  onClick={handlePhotoClick}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Ekran okuyucu için sessiz duyuru — görsel sayaç yalnızca lightbox'ta
            vardı, ana slider'da klavye ile gezinirken hiçbir bildirim yoktu
            (a11y denetimi bulgusu). */}
        <p className="sr-only" aria-live="polite">{`Fotoğraf ${active + 1} / ${photos.length}`}</p>

        {photos.length > 1 && (
          <>
            {/* Masaüstünde hover'da beliren ok butonları — mobilde swipe zaten
                yeterli. focus-visible:opacity-100 eklendi: önceden yalnız
                hover'da görünüyordu, klavye ile Tab'lanan kullanıcı butona
                odaklanınca onu GÖREMİYORDU (a11y denetimi bulgusu). */}
            {active > 0 && (
              <button
                type="button"
                onClick={() => goToRelative(-1)}
                aria-label="Önceki fotoğraf"
                className="hidden sm:flex opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 border border-gray-100 items-center justify-center text-gray-600 hover:text-gray-900 shadow-sm"
              >
                ‹
              </button>
            )}
            {active < photos.length - 1 && (
              <button
                type="button"
                onClick={() => goToRelative(1)}
                aria-label="Sonraki fotoğraf"
                className="hidden sm:flex opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 border border-gray-100 items-center justify-center text-gray-600 hover:text-gray-900 shadow-sm"
              >
                ›
              </button>
            )}

            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1">
              {photos.map((p, i) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => goTo(i)}
                  aria-label={`${i + 1}. fotoğrafa git`}
                  aria-current={i === active}
                  // Görünür nokta küçük kalsın ama dokunma alanı büyütülsün —
                  // önceden 6px'lik bir hedefe mobilde isabet ettirmek zordu
                  // (a11y/mobil denetimi bulgusu).
                  className="p-2 -m-1 flex items-center justify-center"
                >
                  <span className={`block rounded-full transition-all ${i === active ? "w-4 h-1.5 bg-white" : "w-1.5 h-1.5 bg-white/50"}`} />
                </button>
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
          role="dialog"
          aria-modal="true"
          aria-label="Fotoğraf büyütme"
        >
          <button
            ref={closeBtnRef}
            type="button"
            onClick={() => setLightboxOpen(false)}
            aria-label="Kapat"
            className="absolute top-4 right-4 w-11 h-11 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors"
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
                  onClick={(e) => { e.stopPropagation(); goToRelative(-1); }}
                  aria-label="Önceki fotoğraf"
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors"
                >
                  ‹
                </button>
              )}
              {active < photos.length - 1 && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); goToRelative(1); }}
                  aria-label="Sonraki fotoğraf"
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors"
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
