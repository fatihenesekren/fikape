"use client";

// Native scrollTo({behavior:"smooth"}) süresi tarayıcı/cihaza göre değişiyor
// ve mobilde çok kısa sürüp aniden zıplama hissi verebiliyor — sabit süreli
// kendi animasyonumuzla tutarlı bir his sağlıyoruz. ease-out (kübik) mesafenin
// %87'sini sürenin ilk yarısında bitirip "fırlama" hissi verdiği için,
// yavaş başlayıp ortada hızlanan, yavaş biten ease-in-out kullanılıyor.
function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function smoothScrollToTop(duration = 700) {
  const start = window.scrollY;
  if (start === 0) return;
  const startTime = performance.now();

  function step(now: number) {
    const progress = Math.min((now - startTime) / duration, 1);
    const eased = easeInOutCubic(progress);
    window.scrollTo(0, start * (1 - eased));
    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

export function ScrollTopLogo() {
  return (
    <button
      onClick={() => smoothScrollToTop()}
      aria-label="Sayfa başına dön"
      className="inline-flex items-center gap-0.5 text-2xl font-black tracking-tight select-none px-3 py-2 mb-2 hover:opacity-80 transition-opacity"
    >
      <span style={{ color: "#85B7EB" }}>fi</span>
      <span className="text-gray-600 font-light">·</span>
      <span style={{ color: "#97C459" }}>ka</span>
      <span className="text-gray-600 font-light">·</span>
      <span style={{ color: "#F0997B" }}>pe</span>
    </button>
  );
}
