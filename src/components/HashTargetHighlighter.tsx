"use client";

import { useEffect } from "react";

const FLASH_CLASS = "hash-target-flash";
const FLASH_DURATION_MS = 1600;

function highlight(id: string) {
  const el = document.getElementById(id);
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

// Sayfa içi "bkz./aşağıdaki X" linklerine TIKLANINCA hedefi kısa süreli
// vurgulayan flash + gerekirse kaydırma. `hashchange` event'i yerine
// bilerek tıklama delegasyonu kullanılıyor: `hashchange` yalnızca URL'deki
// hash DEĞERİ değişince tetikleniyor, aynı linke art arda tıklanınca (hash
// zaten aynı olduğu için) hiç ateşlenmiyordu — ikinci tıklamadan sonra
// vurgunun kaybolması bu yüzdendi (bkz. kullanıcı geri bildirimi). Tıklama
// delegasyonu her tıklamada çalışır, hash değişip değişmediğine bakmaz.
// Sayfa ilk yüklendiğinde (mount'ta) hâlâ ÇALIŞMAZ — sadece gerçek bir
// tıklama bu efekti tetikler.
export function HashTargetHighlighter() {
  useEffect(() => {
    function onClick(e: MouseEvent) {
      const anchor = (e.target as HTMLElement)?.closest?.('a[href^="#"]');
      if (!anchor) return;
      const id = anchor.getAttribute("href")?.slice(1);
      if (!id) return;
      // Tarayıcının kendi hash-scroll'u ile aynı task'ta çakışmasın diye
      // bir sonraki task'a bırakılıyor.
      setTimeout(() => highlight(id), 0);
    }

    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  return null;
}
