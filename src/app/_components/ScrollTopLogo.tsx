"use client";

// Native scrollTo({behavior:"smooth"}) süresi tarayıcı/cihaza göre değişiyor
// ve mobilde çok kısa sürüp aniden zıplama hissi verebiliyor — sabit süreli,
// ease-out'lu kendi animasyonumuzla tutarlı bir his sağlıyoruz.
function smoothScrollToTop(duration = 600) {
  const start = window.scrollY;
  if (start === 0) return;
  const startTime = performance.now();

  function step(now: number) {
    const progress = Math.min((now - startTime) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
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
