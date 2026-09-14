"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/Avatar";
import { sameDay, hhmm, dayLabel } from "@/lib/messageTime";

interface MessageView {
  id: number;
  text: string;
  isOwn: boolean;
  isRead: boolean;
  createdAt: string;
}

// Görsel dil Takas Mesajlarım thread ekranıyla (mesajlar/[threadId]) BİLİNÇLİ
// olarak birebir aynı — kullanıcı "Takas Mesajlarımdaki gibi modern bir
// görünüm" istedi: tam yükseklik sohbet düzeni, tarih ayraçları, "Yeni"
// böleni, okundu/iletildi göstergesi, otomatik büyüyen metin alanı + yuvarlak
// gönder butonu. "İletişim doğru muydu?" sorusu artık burada YOK — usta
// profil sayfasına (iletişim bilgisinin gösterildiği yere) taşındı.
export function ExpertThreadView({
  threadId, counterpartName, counterpartAvatarUrl, counterpartSeed, expertHeadline, messages,
  firstUnreadId, lastMineId, initialBlockedByMe, initialBlockedByThem,
}: {
  threadId: number;
  counterpartName: string;
  counterpartAvatarUrl: string | null;
  counterpartSeed: string;
  expertHeadline: string | null;
  messages: MessageView[];
  firstUnreadId: number | null;
  lastMineId: number | null;
  initialBlockedByMe: boolean;
  initialBlockedByThem: boolean;
}) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [blocked, setBlocked] = useState(initialBlockedByMe);
  const blockedByThem = initialBlockedByThem;
  // Önceden window.confirm() (tarayıcı varsayılanı, sitenin hiçbir yerinde
  // kullanılmıyor) — kullanıcı fark etti. Takas Mesajlarım'daki ThreadActions
  // modal deseniyle birebir aynı: bottom-sheet, "Vazgeç" + kırmızı onay butonu.
  const [confirmBlock, setConfirmBlock] = useState(false);
  const [blocking, setBlocking] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const now = new Date();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  function autoGrow() {
    const el = taRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 140) + "px";
  }

  async function send() {
    const value = text.trim();
    if (!value || sending) return;
    setSending(true);
    setError("");
    try {
      const res = await fetch(`/api/expert-message-threads/${threadId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: value }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Bir hata oluştu.");
        setSending(false);
        return;
      }
      setText("");
      requestAnimationFrame(autoGrow);
      router.refresh();
    } catch {
      setError("Bağlantı hatası.");
    } finally {
      setSending(false);
    }
  }

  async function block() {
    setBlocking(true);
    try {
      const res = await fetch(`/api/expert-message-threads/${threadId}/block`, { method: "POST" });
      if (res.ok) setBlocked(true);
    } finally {
      setBlocking(false);
      setConfirmBlock(false);
    }
  }

  const canMessage = !blocked && !blockedByThem;
  const statusChip = blocked
    ? { label: "Engellendi", cls: "bg-red-50 text-red-600" }
    : blockedByThem
      ? { label: "Kapatıldı", cls: "bg-gray-100 text-gray-500" }
      : { label: "Aktif", cls: "bg-green-50 text-green-700" };

  return (
    <div className="max-w-2xl w-full mx-auto flex flex-col" style={{ height: "calc(100dvh - 3.5rem)" }}>
      {/* ── Başlık ── */}
      <div className="shrink-0 border-b border-gray-100">
        <div className="px-4 pt-3">
          <Link href="/mesajlar?tab=usta" className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Mesajlarım
          </Link>
        </div>
        <div className="px-4 py-2.5 flex items-center gap-3">
          <Avatar displayName={counterpartName} avatarUrl={counterpartAvatarUrl} seed={counterpartSeed} size={36} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-gray-900 truncate">{counterpartName}</span>
              <span className={`shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusChip.cls}`}>
                {statusChip.label}
              </span>
            </div>
            {expertHeadline && <p className="text-xs text-gray-400 truncate">{expertHeadline}</p>}
          </div>
          {!blocked && !blockedByThem && (
            <button onClick={() => setConfirmBlock(true)} className="text-xs text-red-600 hover:underline shrink-0">
              Engelle
            </button>
          )}
        </div>
      </div>

      {confirmBlock && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 px-4 py-6"
          onClick={() => setConfirmBlock(false)}
        >
          <div className="bg-white rounded-2xl w-full max-w-sm p-5 text-left" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-sm font-bold text-gray-900 mb-1.5">Kişiyi engelle</h3>
            <p className="text-sm text-gray-500 mb-4">
              <strong className="text-gray-700">{counterpartName}</strong> bu görüşmede size bir daha
              yazamaz, siz de ona yazamazsınız. Engeli <strong className="text-gray-700">Profil ›
              Engellenen kullanıcılar</strong>&apos;dan kaldırabilirsiniz. Karşı tarafa bildirim gitmez.
            </p>
            <div className="flex items-center gap-2 justify-end">
              <button onClick={() => setConfirmBlock(false)} className="text-xs text-gray-400 hover:underline px-2">Vazgeç</button>
              <button
                onClick={block}
                disabled={blocking}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-60 transition-colors"
              >
                {blocking ? "İşleniyor…" : "Engelle"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Mesajlar ── */}
      <div className="flex-1 overflow-y-auto">
        <div className="min-h-full flex flex-col justify-end px-4 py-4 gap-1">
          {messages.length === 0 ? (
            <p className="text-center text-xs text-gray-400 py-8">Henüz mesaj yok. Merak ettiğiniz bir şeyi sorarak başlayın.</p>
          ) : (
            <p className="text-center text-[10px] text-gray-300 pb-1">Görüşmenin başlangıcı</p>
          )}

          {messages.map((m, i) => {
            const created = new Date(m.createdAt);
            const prev = i > 0 ? messages[i - 1] : null;
            const showDate = !prev || !sameDay(new Date(prev.createdAt), created);
            const isFirstUnread = m.id === firstUnreadId;
            const isLastMine = m.id === lastMineId;

            return (
              <Fragment key={m.id}>
                {showDate && (
                  <div className="text-center my-2">
                    <span className="text-[11px] text-gray-400 bg-gray-50 rounded-full px-2.5 py-0.5">
                      {dayLabel(created, now)}
                    </span>
                  </div>
                )}
                {isFirstUnread && (
                  <div className="flex items-center gap-2 my-1.5">
                    <span className="flex-1 h-px bg-amber-200" />
                    <span className="text-[10px] font-semibold text-amber-600 uppercase tracking-wide">Yeni</span>
                    <span className="flex-1 h-px bg-amber-200" />
                  </div>
                )}
                <div className={`flex ${m.isOwn ? "justify-end" : "justify-start"}`}>
                  <div className="max-w-[80%]">
                    <div
                      className={`rounded-2xl px-3.5 py-2 text-sm leading-relaxed border ${
                        m.isOwn
                          ? "bg-green-50 border-green-100 text-green-900 rounded-br-md"
                          : "bg-amber-50 border-amber-100 text-amber-900 rounded-bl-md"
                      }`}
                    >
                      <p className="whitespace-pre-wrap break-words">{m.text}</p>
                    </div>
                    <div className={`flex items-center gap-1.5 mt-0.5 ${m.isOwn ? "justify-end" : "justify-start"}`}>
                      <span className="text-[10px] text-gray-400">{hhmm(created)}</span>
                      {isLastMine && (
                        <span className="text-[10px] text-gray-400">· {m.isRead ? "Görüldü" : "İletildi"}</span>
                      )}
                    </div>
                  </div>
                </div>
              </Fragment>
            );
          })}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* ── Giriş alanı ── */}
      <div className="shrink-0 border-t border-gray-100 bg-white">
        {canMessage ? (
          <div className="p-3 space-y-1.5">
            {error && <p className="text-xs text-red-600">{error}</p>}
            <div className="flex gap-2 items-end">
              <textarea
                ref={taRef}
                value={text}
                onChange={(e) => { setText(e.target.value.slice(0, 1000)); autoGrow(); }}
                placeholder="Mesajınızı yazınız…"
                rows={1}
                className="flex-1 text-sm rounded-xl border border-gray-200 px-3 py-2 resize-none focus:outline-none focus:border-link focus:ring-2 focus:ring-link-soft transition-colors"
              />
              <button
                type="button"
                onClick={send}
                disabled={sending || text.trim() === ""}
                aria-label="Gönder"
                className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-white disabled:opacity-40 transition-opacity"
                style={{ background: "var(--link-deep)" }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M4 12l16-8-6 16-2.5-6L4 12z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          </div>
        ) : (
          <p className="p-4 text-sm text-gray-400 text-center">
            {blocked ? "Bu kullanıcıyı engellediniz." : "Bu kullanıcıyla mesajlaşamazsınız."}
          </p>
        )}
      </div>
    </div>
  );
}
