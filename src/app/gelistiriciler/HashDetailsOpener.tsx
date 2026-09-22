"use client";

import { useEffect } from "react";

// "bkz. SSS" gibi sayfa içi linkler kapalı bir <details>'i hedefliyorsa,
// tarayıcı URL fragment'ına otomatik kaydırır ama <details>'i AÇMAZ —
// kullanıcı görünmeyen bir bölüme kaydırılmış olur. Bu, hedef kapalı bir
// <details> ise onu açıp yeniden konuma kaydıran minimal bir düzeltme.
export function HashDetailsOpener() {
  useEffect(() => {
    function openTarget() {
      const hash = window.location.hash.slice(1);
      if (!hash) return;
      const el = document.getElementById(hash);
      if (el instanceof HTMLDetailsElement && !el.open) {
        el.open = true;
        requestAnimationFrame(() => el.scrollIntoView({ block: "start" }));
      }
    }
    openTarget();
    window.addEventListener("hashchange", openTarget);
    return () => window.removeEventListener("hashchange", openTarget);
  }, []);

  return null;
}
