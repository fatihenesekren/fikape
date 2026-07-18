"use client";

export function ScrollTopLogo() {
  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
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
