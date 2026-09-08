"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

// "Sayfa başına dön" — HomeFab'dan (ana sayfaya git, dolu siyah daire, ev
// ikonu, bottom-5) BİLİNÇLİ olarak ayrı: beyaz daire + FI lacivert yukarı ok
// + scroll ilerleme halkası, HomeFab'ın hemen üstünde. Kontrollü easing ile
// yukarı kayar (prefers-reduced-motion'da anında).

const SHOW_AFTER = 500;      // px — bu kadar aşağı inince belirir
const DURATION = 550;        // ms — kontrollü scroll süresi
const R = 19;                // ilerleme halkası yarıçapı (44px daire içinde)
const C = 2 * Math.PI * R;   // çevre

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

export function BackToTop() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    function update() {
      const y = window.scrollY;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setVisible(y > SHOW_AFTER);
      setProgress(max > 0 ? Math.min(1, Math.max(0, y / max)) : 0);
      rafRef.current = null;
    }
    function onScroll() {
      if (rafRef.current == null) rafRef.current = requestAnimationFrame(update);
    }
    update(); // ilk ölçüm hemen (HomeFab ile aynı desen)
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const scrollToTop = useCallback(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      window.scrollTo(0, 0);
      return;
    }
    const start = window.scrollY;
    const t0 = performance.now();
    function step(now: number) {
      const p = Math.min(1, (now - t0) / DURATION);
      window.scrollTo(0, Math.round(start * (1 - easeOutCubic(p))));
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }, []);

  return (
    <button
      type="button"
      onClick={scrollToTop}
      aria-label="Sayfa başına dön"
      aria-hidden={!visible}
      tabIndex={visible ? 0 : -1}
      className={`fixed right-5 z-50 w-11 h-11 rounded-full bg-white border border-gray-200 shadow-lg flex items-center justify-center transition-all duration-300 hover:border-gray-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-link focus-visible:ring-offset-2 ${
        pathname === "/" ? "bottom-5" : "bottom-20"
      } ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"}`}
    >
      {/* Scroll ilerleme halkası */}
      <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 44 44" aria-hidden="true">
        <circle cx="22" cy="22" r={R} fill="none" stroke="#E6F1FB" strokeWidth="2.5" />
        <circle
          cx="22" cy="22" r={R} fill="none"
          stroke="var(--link)" strokeWidth="2.5" strokeLinecap="round"
          strokeDasharray={C}
          strokeDashoffset={C * (1 - progress)}
          style={{ transition: "stroke-dashoffset 120ms linear" }}
        />
      </svg>
      {/* Yukarı ok */}
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M12 19V5M5 12l7-7 7 7" stroke="var(--link)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}
