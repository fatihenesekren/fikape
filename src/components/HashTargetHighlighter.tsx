"use client";

import { useEffect } from "react";

const FLASH_CLASS = "hash-target-flash";
const FLASH_DURATION_MS = 1600;

// Sayfa içi "bkz./aşağıdaki X" linklerine TIKLANINCA hedefi kısa süreli
// vurgulayan flash + gerekirse kaydırma. Bilinçli olarak SADECE hashchange
// event'inde çalışır, sayfa ilk yüklendiğinde (mount'ta) ÇALIŞMAZ — URL'de
// zaten bir hash varken sayfayı açmak (örn. eski bir sekme/bookmark, paylaşılan
// link) otomatik kaydırmaya yol açmamalı; kullanıcı bunu istemedi (bkz. geri
// bildirim: "linke tıklamadan gidiyor").
export function HashTargetHighlighter() {
  useEffect(() => {
    function handleHash() {
      const hash = window.location.hash.slice(1);
      if (!hash) return;
      const el = document.getElementById(hash);
      if (!el) return;

      if (el instanceof HTMLDetailsElement && !el.open) {
        el.open = true;
      }

      // Aynı hedefe art arda tıklanırsa animasyonun yeniden tetiklenmesi için
      // sınıf önce kaldırılıp senkron bir reflow zorlanır (requestAnimationFrame
      // yerine — pane/tab arka plandayken rAF hiç çalışmıyor, bu daha güvenilir).
      el.classList.remove(FLASH_CLASS);
      void el.offsetWidth;
      el.classList.add(FLASH_CLASS);
      el.scrollIntoView({ block: "start", behavior: "smooth" });
      setTimeout(() => el.classList.remove(FLASH_CLASS), FLASH_DURATION_MS);
    }

    window.addEventListener("hashchange", handleHash);
    return () => window.removeEventListener("hashchange", handleHash);
  }, []);

  return null;
}
