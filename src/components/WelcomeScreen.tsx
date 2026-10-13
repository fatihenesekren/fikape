"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useSyncExternalStore } from "react";
import { FIKAPE_SOFT } from "@/lib/fikape";

// Uygulama (PWA) ilk açılış karşılaması: yalnızca "ana ekrandan yüklenmiş" (display-mode: standalone) kullanıcıya ve
// yalnızca ana sayfa açılışında, bir kez gösterilir. Tarayıcı ziyaretçisi ve arama botları görmez (sunucu HTML'ine
// ekran konmaz). layout.tsx'teki satır içi betik, standalone + bayrak yoksa <html data-welcome> koyar: hidrasyondan
// önce sayfa gizli ve zemin #111 kalır, beyaz bir an görünmez. Her çıkış bayrağı yazar.
export const WELCOME_BAYRAK = "fikape_welcome_v1";

// 4 sn sonra öznitelik her durumda kalkar: betik/hidrasyon takılsa bile sayfa gizli kalmaz.
export const WELCOME_ONYUKLEME = `(function(){try{var d=document.documentElement;var s=window.matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;if(s&&location.pathname==='/'&&!localStorage.getItem('${WELCOME_BAYRAK}')){d.setAttribute('data-welcome','1');setTimeout(function(){d.removeAttribute('data-welcome')},4000)}}catch(e){}})();`;

// <html data-welcome> öznitelik değişimlerini dinler: ekran açık mı bilgisi tek kaynak bu öznitelik.
function abone(cb: () => void) {
  const mo = new MutationObserver(cb);
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-welcome"] });
  return () => mo.disconnect();
}
const acikMi = () => document.documentElement.getAttribute("data-welcome") === "1";

const FOCUS =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#111]";

export function WelcomeScreen() {
  const acik = useSyncExternalStore(abone, acikMi, () => false);
  const baslikRef = useRef<HTMLHeadingElement>(null);

  const kapat = useCallback(() => {
    try {
      localStorage.setItem(WELCOME_BAYRAK, "1");
    } catch {
      // yok sayılır
    }
    document.documentElement.removeAttribute("data-welcome");
  }, []);

  // Açıkken: durum çubuğu rengi koyu, Esc kapatır, odak başlığa.
  useEffect(() => {
    if (!acik) return;
    const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    const onceki = meta?.content;
    if (meta) meta.content = "#111111";
    baslikRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") kapat();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      if (meta && onceki !== undefined) meta.content = onceki;
    };
  }, [acik, kapat]);

  if (!acik) return null;

  return (
    <div
      id="welcome"
      role="dialog"
      aria-modal="true"
      aria-labelledby="welcome-baslik"
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#111] px-6 text-center"
      style={{ paddingTop: "env(safe-area-inset-top)", paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <button
        type="button"
        onClick={kapat}
        className={`absolute right-3 top-3 min-h-11 rounded-lg px-4 text-sm text-gray-400 hover:text-white ${FOCUS}`}
        style={{ marginTop: "env(safe-area-inset-top)" }}
      >
        Atla
      </button>

      <svg width="72" height="72" viewBox="0 0 100 100" fill="none" strokeWidth={15} strokeLinecap="round" aria-hidden="true">
        <path className="welcome-yay welcome-yay-1" pathLength={1} d="M20 23 A40 40 0 0 1 80 23" stroke={FIKAPE_SOFT.fi} />
        <path className="welcome-yay welcome-yay-2" pathLength={1} d="M88 38 A40 40 0 0 1 58 89" stroke={FIKAPE_SOFT.pe} />
        <path className="welcome-yay welcome-yay-3" pathLength={1} d="M42 89 A40 40 0 0 1 12 38" stroke={FIKAPE_SOFT.ka} />
      </svg>

      <p className="welcome-yazi mt-4 flex items-baseline gap-1 text-4xl font-black tracking-tight" aria-hidden="true">
        <span style={{ color: FIKAPE_SOFT.fi }}>fi</span>
        <span className="font-black text-gray-500">·</span>
        <span style={{ color: FIKAPE_SOFT.ka }}>ka</span>
        <span className="font-black text-gray-500">·</span>
        <span style={{ color: FIKAPE_SOFT.pe }}>pe</span>
      </p>

      <h1
        id="welcome-baslik"
        ref={baslikRef}
        tabIndex={-1}
        className="welcome-yazi mt-10 max-w-xs text-3xl font-bold leading-tight text-white outline-none"
      >
        Aracın hakkında ne düşünüyorsun?
      </h1>
      <p className="welcome-yazi mt-3 max-w-xs text-base text-gray-400">Yorumun bir sonraki alıcının kararını değiştirebilir.</p>

      <div className="welcome-yazi mt-10 flex w-full max-w-xs flex-col gap-3">
        <Link
          href="/yorum-yaz"
          onClick={kapat}
          className={`inline-flex min-h-12 items-center justify-center rounded-xl bg-white px-6 text-base font-bold text-[#111] hover:bg-gray-100 ${FOCUS}`}
        >
          Yorum Yaz <span aria-hidden="true" className="ml-1">→</span>
        </Link>
        <Link
          href="/oner"
          onClick={kapat}
          className={`inline-flex min-h-12 items-center justify-center rounded-xl border border-white/40 px-6 text-base font-semibold text-white hover:bg-white/10 ${FOCUS}`}
        >
          Araç Öner
        </Link>
        <button type="button" onClick={kapat} className={`mt-2 min-h-11 rounded-lg text-sm text-gray-400 hover:text-white ${FOCUS}`}>
          Gezmeye başla
        </button>
      </div>
    </div>
  );
}
