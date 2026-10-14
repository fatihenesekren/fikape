"use client";

import { useCallback, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

type Options = {
  /** Düzenli yenileme aralığı (ms). Sekme gizliyken atlanır. */
  intervalMs: number;
  /** Zorlanmayan yenilemeler (aralık, sayfa geçişi, odak) arasındaki en kısa süre (ms). */
  minGapMs: number;
};

/**
 * Bildirim/mesaj zili için ortak yenileme kancası:
 * - mount'ta bir kez, sonra intervalMs'te bir (sekme gizliyken YOK),
 * - sekme tekrar görünür/odaklanınca ve sayfa değişince (minGapMs ile kısıtlı; focus+visibility çift istek üretmez),
 * - `refresh(true)` kısıtı aşar (olay kaynaklı yenileme); uçuştaki eski istek iptal edilir, yanıtı state'e yazılmaz.
 * `load` imzası: sinyal iptal edildiyse state yazmamalıdır.
 */
export function useThrottledRefresh(load: (signal: AbortSignal) => Promise<void>, { intervalMs, minGapMs }: Options) {
  const loadRef = useRef(load);
  useEffect(() => {
    loadRef.current = load;
  });
  const lastRef = useRef(0);
  const ctrlRef = useRef<AbortController | null>(null);
  const pathname = usePathname();

  const refresh = useCallback(
    async (force = false) => {
      if (!force) {
        if (typeof document !== "undefined" && document.hidden) return;
        if (Date.now() - lastRef.current < minGapMs) return;
      }
      ctrlRef.current?.abort();
      const ctrl = new AbortController();
      ctrlRef.current = ctrl;
      lastRef.current = Date.now();
      try {
        await loadRef.current(ctrl.signal);
      } catch {
        /* ağ hatası/iptal: sessiz; bir sonraki yenileme dener */
      }
    },
    [minGapMs],
  );

  useEffect(() => {
    void refresh(true);
    const iv = setInterval(() => void refresh(false), intervalMs);
    const onVisible = () => {
      if (!document.hidden) void refresh(false);
    };
    const onFocus = () => void refresh(false);
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onFocus);
    return () => {
      clearInterval(iv);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onFocus);
      ctrlRef.current?.abort();
    };
  }, [refresh, intervalMs]);

  // Sayfa değişince (ilk açılış hariç) yenile — başka sayfada okunan/gelen bildirimler hemen yansısın.
  const ilkPath = useRef(pathname);
  useEffect(() => {
    if (ilkPath.current === pathname) return;
    ilkPath.current = pathname;
    void refresh(false);
  }, [pathname, refresh]);

  return refresh;
}
