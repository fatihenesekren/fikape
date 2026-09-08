"use client";

import { useEffect } from "react";

// Son Yorumlar şeridinden gelen #yorum-<id> derin bağlantısı: ilgili yoruma
// kaydır + kısa bir vurgu halkası. Yorumlar sekmesi varsayılan olduğu için
// hedef DOM'da hazır; değilse (ör. ?sekme=soru-cevap) sessizce hiçbir şey yapmaz.
const RING = ["ring-2", "ring-indigo-400", "ring-offset-2", "rounded-2xl"];

export function ScrollToReview() {
  useEffect(() => {
    const m = window.location.hash.match(/^#yorum-(\d+)$/);
    if (!m) return;
    const el = document.getElementById(`yorum-${m[1]}`);
    if (!el) return;

    el.scrollIntoView({ behavior: "smooth", block: "center" });
    el.classList.add(...RING, "transition-shadow", "duration-300");
    const t = setTimeout(() => el.classList.remove(...RING), 2600);
    return () => clearTimeout(t);
  }, []);

  return null;
}
