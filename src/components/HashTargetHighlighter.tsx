"use client";

import { useEffect } from "react";

const FLASH_CLASS = "hash-target-flash";
const FLASH_DURATION_MS = 1600;

// Sayfa içi "bkz./aşağıdaki X" linkleriyle işaret edilen hedefi kısa süreli
// vurgulayan flash + gerekirse kaydırma. İki sorunu birden çözüyor:
// 1) Hedef kapalı bir <details> ise tarayıcı bunu otomatik açmıyor —
//    açılmadan kaydırma kullanıcıya görünmeyen bir yere gitmiş gibi gelir.
// 2) Hedef zaten ekranda görünüyorsa (yakın referanslar) kaydırma
//    hissedilmiyor, tıklamanın hiçbir etkisi olmamış gibi görünüyor —
//    bkz. kullanıcı geri bildirimi. Flash, mesafeden bağımsız her durumda
//    "işte bahsettiğim yer burası" geri bildirimini veriyor.
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

    handleHash();
    window.addEventListener("hashchange", handleHash);
    return () => window.removeEventListener("hashchange", handleHash);
  }, []);

  return null;
}
