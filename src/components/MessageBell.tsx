"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Avatar } from "./Avatar";
import { MessageIcon } from "./AuthNav";

interface MessagePreview {
  id: string;
  kind: "takas" | "usta";
  href: string;
  counterpartName: string | null;
  counterpartAvatarUrl: string | null;
  counterpartSeed: string;
  subtitle: string | null;
  lastMessage: string;
  unreadCount: number;
  when: string;
}

const KIND_LABEL: Record<MessagePreview["kind"], string> = {
  takas: "Takas",
  usta: "Usta Mesajı",
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("tr-TR", { day: "numeric", month: "short" });
}

// Header'daki mesaj ikonu — önceden düz bir /mesajlar linkiydi, zil gibi bir
// önizleme paneli açmıyordu (kullanıcı fark etti). NotificationBell.tsx'teki
// AYNI iskelet: aç/kapa, dışarı tıklayınca/sayfa değişince kapanma, hafif
// polling. Takas ve Usta mesajları AYRI sekmeler değil, tek karışık listede
// (en son gelen üstte) — her satırda küçük bir tür etiketiyle ("Takas" /
// "Usta Mesajı") ayırt ediliyor, bildirim çanının tür etiketi deseniyle aynı.
export function MessageBell({ onUnreadCountChange }: { onUnreadCountChange?: (count: number) => void }) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [threads, setThreads] = useState<MessagePreview[]>([]);
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
    function handlePointerDown(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative hidden sm:block">
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
        <div className="absolute left-1/2 -translate-x-1/2 sm:left-auto sm:right-0 sm:translate-x-0 top-full mt-2 w-80 max-w-[calc(100vw-2rem)] bg-white border border-gray-100 rounded-2xl shadow-lg z-50 overflow-hidden">
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
                  onClick={() => setOpen(false)}
                  className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                  style={{ background: t.unreadCount > 0 ? "#F0F7FF" : undefined }}
                >
                  <Avatar displayName={t.counterpartName} avatarUrl={t.counterpartAvatarUrl} seed={t.counterpartSeed} size={36} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">{KIND_LABEL[t.kind]}</p>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm truncate ${t.unreadCount > 0 ? "font-bold text-gray-900" : "font-semibold text-gray-800"}`}>
                        {t.counterpartName ?? "Kullanıcı"}
                      </span>
                      <span className="ml-auto shrink-0 text-[11px] text-gray-400">{fmtDate(t.when)}</span>
                    </div>
                    {t.subtitle && <p className="text-[11px] text-gray-400 truncate">{t.subtitle}</p>}
                    <p className={`text-xs truncate mt-0.5 ${t.unreadCount > 0 ? "text-gray-700 font-medium" : "text-gray-400"}`}>
                      {t.lastMessage}
                    </p>
                  </div>
                  {t.unreadCount > 0 && <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-1.5" />}
                </Link>
              ))}
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
