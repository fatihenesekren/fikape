"use client";

import { bildirimLinkiGuvenli } from "@/lib/bildirimLinki";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { TYPE_ICON, TYPE_LABEL, type NotificationData } from "./NotificationList";
import { useAnchoredPosition } from "@/lib/useAnchoredPosition";
import { useThrottledRefresh } from "@/lib/useThrottledRefresh";
import { applyNotificationsChange, NOTIFICATIONS_CHANGED_EVENT, type NotificationsChange } from "@/lib/notificationSyncCore";

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("tr-TR", { day: "numeric", month: "short" });
}

export function NotificationBell() {
  const [data, setData] = useState<{ unreadCount: number; notifications: NotificationData[] }>({ unreadCount: 0, notifications: [] });
  const { unreadCount, notifications } = data;
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();
  const panelStyle = useAnchoredPosition(btnRef, open, 320, () => setOpen(false));

  // Yenileme: mount'ta, 60 sn'de bir (sekme gizliyken yok), sekme odağında ve sayfa değişince (30 sn kısıtlı).
  const refresh = useThrottledRefresh(
    async (signal) => {
      try {
        const res = await fetch("/api/notifications", { signal });
        if (!res.ok || signal.aborted) return;
        const veri = await res.json();
        if (signal.aborted) return;
        setData({ unreadCount: veri.unreadCount, notifications: veri.notifications ?? [] });
      } finally {
        if (!signal.aborted) setLoaded(true);
      }
    },
    { intervalMs: 60_000, minGapMs: 30_000 },
  );

  // Başka yerde (örn. /bildirimler, profil listesi) okundu işaretlenince zil HEMEN güncellensin; ardından sunucudan doğrula.
  useEffect(() => {
    const onChange = (e: Event) => {
      const degisiklik = (e as CustomEvent<NotificationsChange>).detail ?? {};
      setData((prev) => applyNotificationsChange(prev, degisiklik));
      void refresh(true);
    };
    window.addEventListener(NOTIFICATIONS_CHANGED_EVENT, onChange);
    return () => window.removeEventListener(NOTIFICATIONS_CHANGED_EVENT, onChange);
  }, [refresh]);

  // Ekran okuyucu: yalnız sayı DEĞİŞTİĞİNDE duyur (her yenilemede değil).
  const [oncekiSayi, setOncekiSayi] = useState<number | null>(null);
  const [duyuru, setDuyuru] = useState("");
  if (oncekiSayi !== unreadCount) {
    setOncekiSayi(unreadCount);
    if (oncekiSayi !== null) setDuyuru(unreadCount > 0 ? `${unreadCount} okunmamış bildirim` : "Okunmamış bildirim kalmadı");
  }

  // Sayfa değişince panel her zaman kapansın — sadece dışarı-tıklama algısına
  // güvenmek, bir bildirime tıklayıp client-side navigasyon başladığında bazen
  // kaçırılabiliyordu (bkz. kullanıcı geri bildirimi: panel yeni sayfada açık kalıyor).
  // Effect yerine "prop değişince render sırasında state ayarla" deseni (React
  // docs) — cascading-render uyarısı vermiyor, ekstra render turu da yok.
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    function handlePointerDown(e: MouseEvent | TouchEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    // "touchstart" da dinleniyor — yalnız "mousedown" dokunmatik cihazlarda
    // (özellikle iOS Safari) dışarı dokununca panelin kapanmamasına yol
    // açabiliyordu (3 ajanlı denetim bulgusu, MessageBell.tsx'e paralel).
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  function handleNotificationClick(n: NotificationData) {
    setOpen(false);
    if (n.isRead) return;
    setData((prev) => applyNotificationsChange(prev, { ids: [n.id] }));
    fetch("/api/notifications/mark-read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: [n.id] }),
    }).catch(() => {});
  }

  return (
    <div ref={rootRef} className="relative">
      <span role="status" aria-live="polite" className="sr-only">{duyuru}</span>
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={unreadCount > 0 ? `${unreadCount} okunmamış bildirim` : "Bildirimler"}
        aria-expanded={open}
        className="relative p-2 rounded-md hover:bg-gray-50 transition-colors text-gray-600"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center leading-none">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        // CSS tahminiyle konumlama hep BİR senaryoda kırıldı — panel bazen
        // tıklanan butondan tamamen başka bir yerde görünüyordu (kullanıcı
        // gösterdi). useAnchoredPosition, mobilde eski (sorunsuz) davranışı
        // koruyup sm ve üstünde paneli GERÇEKTEN bu butona göre konumlandırıyor
        // — bkz. MessageBell.tsx'teki aynı fix.
        <div style={panelStyle} data-anchored-panel className="bg-white border border-gray-100 rounded-2xl shadow-lg z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-50">
            <h3 className="text-sm font-bold text-gray-900">Bildirimler</h3>
          </div>

          {!loaded ? (
            <div className="px-4 py-8 text-center text-sm text-gray-400">Yükleniyor...</div>
          ) : notifications.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-gray-400">Henüz bildirimin yok.</div>
          ) : (
            <div className="max-h-96 overflow-auto divide-y divide-gray-50">
              {notifications.map((n) => (
                <Link
                  key={n.id}
                  href={bildirimLinkiGuvenli(n.link)}
                  onClick={() => handleNotificationClick(n)}
                  className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                  style={{ background: !n.isRead ? "#F0F7FF" : undefined }}
                >
                  <span className="text-base shrink-0">{TYPE_ICON[n.type] ?? "🔔"}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">{TYPE_LABEL[n.type] ?? "Bildirim"}</p>
                    <p className="text-sm text-gray-800 line-clamp-2 mt-0.5">{n.message}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{fmtDate(n.createdAt)}</p>
                  </div>
                  {!n.isRead && <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-1.5" />}
                </Link>
              ))}
            </div>
          )}

          <Link
            href="/bildirimler"
            onClick={() => setOpen(false)}
            className="block px-4 py-3 text-center text-xs font-semibold text-gray-500 hover:text-gray-800 border-t border-gray-50"
          >
            Tümünü gör →
          </Link>
        </div>
      )}
    </div>
  );
}
