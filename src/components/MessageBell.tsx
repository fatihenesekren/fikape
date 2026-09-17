"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Avatar } from "./Avatar";
import { MessageIcon } from "./AuthNav";
import type { MessagePreviewItem } from "@/app/api/messages/preview/route";

// Bildirim çanındaki (NotificationList.tsx TYPE_ICON) AYNI aile ikonları —
// Takas 🤝, Usta 🔧 — buraya da taşındı, iki panel arasında görsel bir bağ
// kursun diye (kullanıcı isteği). Köşe rozeti yerine etikete gömülü ikon
// tercih edildi (kullanıcı: "TAKAS (ikon) MESAJI / USTA (ikon) MESAJI").
// Metin de simetrik olsun diye "Takas" → "Takas Mesajı" oldu.
const KIND_ICON: Record<MessagePreviewItem["kind"], string> = {
  takas: "🤝",
  usta: "🔧",
};
const KIND_LABEL: Record<MessagePreviewItem["kind"], string> = {
  takas: "Takas Mesajı",
  usta: "Usta Mesajı",
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("tr-TR", { day: "numeric", month: "short" });
}

// Header'daki mesaj ikonu — önceden düz bir /mesajlar linkiydi, zil gibi bir
// önizleme paneli açmıyordu (kullanıcı fark etti). NotificationBell.tsx'teki
// AYNI iskelet: aç/kapa, dışarı tıklayınca/sayfa değişince kapanma, hafif
// polling. Takas ve Usta mesajları AYRI sekmeler değil, tek karışık listede
// (en son gelen üstte, okunmamışlar önce) — her satırda küçük bir tür
// etiketiyle ("Takas" / "Usta Mesajı") ayırt ediliyor, bildirim çanının tür
// etiketi deseniyle aynı. Artık masaüstü+mobil HER boyutta görünür (3 ajanlı
// denetim bulgusu: bildirim çanı her yerde çalışıyordu, bu yalnız masaüstünde
// vardı — asimetrikti).
export function MessageBell({ onUnreadCountChange }: { onUnreadCountChange?: (count: number) => void }) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [hiddenUnreadCount, setHiddenUnreadCount] = useState(0);
  const [threads, setThreads] = useState<MessagePreviewItem[]>([]);
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    let cancelled = false;
    const load = () => {
      fetch("/api/messages/preview")
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (!cancelled && data) {
            setUnreadCount(data.unreadCount);
            setHiddenUnreadCount(data.hiddenUnreadCount ?? 0);
            setThreads(data.threads ?? []);
            onUnreadCountChange?.(data.unreadCount);
          }
        })
        .catch(() => {})
        .finally(() => { if (!cancelled) setLoaded(true); });
    };
    load();
    const iv = setInterval(load, 45_000);
    return () => { cancelled = true; clearInterval(iv); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // NotificationBell'deki aynı düzeltme: panel sayfa değişince (bir görüşmeye
  // tıklanınca) her zaman kapansın.
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
    // açabiliyordu (3 ajanlı denetim bulgusu).
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  // Bildirim çanı bir bildirime tıklayınca rozeti anında düşürüyor
  // (optimistic update); MessageBell bunu yapmıyordu, rozet en fazla 45sn
  // (bir sonraki poll'a kadar) eski/yanlış sayıyı göstermeye devam ediyordu
  // (3 ajanlı denetim bulgusu — YÜKSEK). Ayrı bir "mark-read" isteği
  // gerekmiyor: hedef thread sayfası (mesajlar/[threadId], usta-mesajlarim/
  // [id]) zaten kendi server-side render'ında mesajları okundu işaretliyor —
  // burada yalnız YEREL state'i (ve dolayısıyla rozeti) önden güncelliyoruz.
  function handleThreadClick(t: MessagePreviewItem) {
    setOpen(false);
    if (t.unreadCount === 0) return;
    setThreads((prev) => prev.map((x) => (x.id === t.id ? { ...x, unreadCount: 0 } : x)));
    setUnreadCount((c) => {
      const next = Math.max(0, c - t.unreadCount);
      onUnreadCountChange?.(next);
      return next;
    });
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={unreadCount > 0 ? `${unreadCount} okunmamış mesaj` : "Mesajlarım"}
        aria-expanded={open}
        className={`relative p-2 rounded-md hover:bg-gray-50 transition-colors ${unreadCount > 0 ? "text-link" : "text-gray-600"}`}
      >
        <MessageIcon />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center leading-none">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        // fixed + viewport köşesi — bkz. NotificationBell.tsx'teki aynı fix
        // (önceki "absolute right-0" denemesi TETİKLEYİCİ BUTONUN kendi
        // dar sarmalayıcısına göre hizalanıyordu; bu buton header'daki
        // ikon kümesinin EN SAĞINDA değilse (avatar/Yorum Yaz ondan
        // sonra geliyorsa) panel sola doğru viewport dışına taşıyordu —
        // kullanıcı gerçek cihazdan gösterdi). fixed, hangi ikonun
        // tetiklediğinden bağımsız olarak her zaman aynı köşeye sabitler.
        <div className="fixed right-4 top-16 w-80 max-w-[calc(100vw-2rem)] bg-white border border-gray-100 rounded-2xl shadow-lg z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-50">
            <h3 className="text-sm font-bold text-gray-900">Mesajlarım</h3>
          </div>

          {!loaded ? (
            <div className="px-4 py-8 text-center text-sm text-gray-400">Yükleniyor...</div>
          ) : threads.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-gray-400">Henüz mesajın yok.</div>
          ) : (
            <div className="max-h-96 overflow-auto divide-y divide-gray-50">
              {threads.map((t) => (
                <Link
                  key={t.id}
                  href={t.href}
                  onClick={() => handleThreadClick(t)}
                  className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                  style={{ background: t.unreadCount > 0 ? "#F0F7FF" : undefined }}
                >
                  <Avatar displayName={t.counterpartName} avatarUrl={t.counterpartAvatarUrl} seed={t.counterpartSeed} size={36} />
                  {/* Bildirimler paneliyle (NotificationBell.tsx) BİREBİR aynı
                      tipografi ölçeği: 10px etiket → text-sm asıl içerik
                      (line-clamp-2) → text-xs tarih en altta. */}
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400 flex items-center gap-1">
                      <span className="text-xs normal-case" aria-hidden>{KIND_ICON[t.kind]}</span>
                      {KIND_LABEL[t.kind]}
                    </p>
                    <p className={`text-sm truncate mt-0.5 ${t.unreadCount > 0 ? "font-bold text-gray-900" : "font-semibold text-gray-800"}`}>
                      {t.counterpartName ?? "Kullanıcı"}
                      {t.subtitle && <span className="font-normal text-gray-400"> · {t.subtitle}</span>}
                      {/* Kapanmış takas görüşmesi — mesajlar/page.tsx'teki
                          "Kapandı" rozetiyle aynı bilgi, önizlemede de
                          gösteriliyor (3 ajanlı denetim bulgusu). */}
                      {t.closed && <span className="font-semibold text-gray-400"> · Kapandı</span>}
                    </p>
                    <p className={`text-sm line-clamp-2 mt-0.5 ${t.unreadCount > 0 ? "text-gray-700 font-medium" : "text-gray-500"}`}>
                      {t.lastMessage}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">{fmtDate(t.when)}</p>
                  </div>
                  {t.unreadCount > 0 && <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-1.5" />}
                </Link>
              ))}
              {hiddenUnreadCount > 0 && (
                // Rozet limitsiz sayıyor, önizleme yalnız ilk 8'i gösteriyor —
                // çok sayıda okunmamış görüşme varsa (nadiren) dürüstçe not
                // düşülüyor (3 ajanlı denetim bulgusu).
                <div className="px-4 py-2 text-center text-xs text-gray-400">
                  +{hiddenUnreadCount} okunmamış mesaj daha
                </div>
              )}
            </div>
          )}

          <Link
            href="/mesajlar"
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
