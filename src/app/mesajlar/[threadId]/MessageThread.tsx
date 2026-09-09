"use client";

import { Fragment, useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { ReportButton } from "./ReportButton";
import { sameDay, hhmm, dayLabel } from "@/lib/messageTime";

interface MessageDTO {
  id: number;
  text: string;
  senderId: number;
  createdAt: string;
  isRead: boolean;
}

interface Props {
  threadId: number;
  currentUserId: number;
  initialMessages: MessageDTO[];
  firstUnreadId: number | null;
  canMessage: boolean;
  stateCard?: ReactNode;
  footer?: ReactNode;
}

const TEMPLATES = [
  "Aracın durumu nasıl?",
  "Üstüne nakit görüşülür mü?",
  "Ekspertiz raporu var mı?",
];

type PendingMsg = { tempId: string; text: string; createdAt: string };

export function MessageThread({
  threadId,
  currentUserId,
  initialMessages,
  firstUnreadId,
  canMessage,
  stateCard,
  footer,
}: Props) {
  const router = useRouter();
  const [pending, setPending] = useState<PendingMsg[]>([]);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  // Sunucu listesi büyüyünce (router.refresh sonrası) bekleyenleri temizle —
  // effect yerine render sırasında state ayarla (cascading-render uyarısı yok).
  const [seenServerCount, setSeenServerCount] = useState(initialMessages.length);
  if (initialMessages.length !== seenServerCount) {
    setSeenServerCount(initialMessages.length);
    setPending([]);
  }

  const bottomRef = useRef<HTMLDivElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [initialMessages.length, pending.length]);

  function autoGrow() {
    const el = taRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 140) + "px";
  }

  async function send() {
    const value = text.trim();
    if (!value || sending) return;
    const tempId = `t${Date.now()}`;
    setError(null);
    setSending(true);
    setPending((p) => [...p, { tempId, text: value, createdAt: new Date().toISOString() }]);
    setText("");
    requestAnimationFrame(autoGrow);
    try {
      const res = await fetch(`/api/trades/threads/${threadId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: value }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setPending((p) => p.filter((m) => m.tempId !== tempId));
        setError(data.error ?? "Mesaj gönderilemedi, tekrar deneyiniz.");
        setText(value);
        return;
      }
      router.refresh();
    } catch {
      setPending((p) => p.filter((m) => m.tempId !== tempId));
      setError("Bir hata oluştu, tekrar deneyiniz.");
      setText(value);
    } finally {
      setSending(false);
    }
  }

  const lastMineId = [...initialMessages].reverse().find((m) => m.senderId === currentUserId)?.id ?? null;
  const now = new Date();

  type Item =
    | { kind: "server"; m: MessageDTO }
    | { kind: "pending"; m: PendingMsg };
  const items: Item[] = [
    ...initialMessages.map((m) => ({ kind: "server" as const, m })),
    ...pending.map((m) => ({ kind: "pending" as const, m })),
  ];

  const showTemplates =
    canMessage && initialMessages.length === 0 && pending.length === 0 && text.trim() === "";

  return (
    <>
      <div className="flex-1 overflow-y-auto">
        <div className="min-h-full flex flex-col justify-end px-4 py-4 gap-1">
          {items.length === 0 ? (
            <p className="text-center text-xs text-gray-400 py-8">
              Henüz mesaj yok. Aracı merak ettiğin bir şeyi sorarak başla.
            </p>
          ) : (
            <p className="text-center text-[10px] text-gray-300 pb-1">Görüşmenin başlangıcı</p>
          )}

          {items.map((it, i) => {
            const created = new Date(it.m.createdAt);
            const prev = i > 0 ? items[i - 1] : null;
            const prevDate = prev ? new Date(prev.m.createdAt) : null;
            const showDate = !prevDate || !sameDay(prevDate, created);
            const isMine = it.kind === "pending" || it.m.senderId === currentUserId;
            const isFirstUnread = it.kind === "server" && it.m.id === firstUnreadId;
            const isLastMine = it.kind === "server" && it.m.id === lastMineId;
            const key = it.kind === "server" ? `s${it.m.id}` : it.m.tempId;

            return (
              <Fragment key={key}>
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
                <div className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                  <div className="max-w-[80%]">
                    <div
                      className={`rounded-2xl px-3.5 py-2 text-sm leading-relaxed border ${
                        isMine
                          ? "bg-green-50 border-green-100 text-green-900 rounded-br-md"
                          : "bg-amber-50 border-amber-100 text-amber-900 rounded-bl-md"
                      } ${it.kind === "pending" ? "opacity-60" : ""}`}
                    >
                      <p className="whitespace-pre-wrap break-words">{it.m.text}</p>
                    </div>
                    <div className={`flex items-center gap-1.5 mt-0.5 ${isMine ? "justify-end" : "justify-start"}`}>
                      <span className="text-[10px] text-gray-400">
                        {it.kind === "pending" ? "gönderiliyor…" : hhmm(created)}
                      </span>
                      {isLastMine && (
                        <span className="text-[10px] text-gray-400">
                          · {it.m.isRead ? "Görüldü" : "İletildi"}
                        </span>
                      )}
                      {!isMine && it.kind === "server" && <ReportButton messageId={it.m.id} />}
                    </div>
                  </div>
                </div>
              </Fragment>
            );
          })}
          <div ref={bottomRef} />
        </div>
      </div>

      <div className="shrink-0 border-t border-gray-100 bg-white">
        {showTemplates && (
          <div className="flex flex-wrap gap-1.5 px-3 pt-2.5">
            {TEMPLATES.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => { setText(t); requestAnimationFrame(() => { autoGrow(); taRef.current?.focus(); }); }}
                className="text-[11px] font-medium text-gray-500 border border-gray-200 rounded-full px-2.5 py-1 hover:bg-gray-50 transition-colors"
              >
                {t}
              </button>
            ))}
          </div>
        )}

        {canMessage ? (
          <div className="p-3 space-y-1.5">
            {error && <p className="text-xs text-red-600">{error}</p>}
            <div className="flex gap-2 items-end">
              <textarea
                ref={taRef}
                value={text}
                onChange={(e) => { setText(e.target.value); autoGrow(); }}
                placeholder="Mesajınızı yazınız…"
                rows={1}
                maxLength={1000}
                className="flex-1 text-sm rounded-xl border border-gray-200 px-3 py-2 resize-none focus:outline-none focus:border-link focus:ring-2 focus:ring-link-soft transition-colors"
              />
              <button
                type="button"
                onClick={send}
                disabled={sending || text.trim() === ""}
                aria-label="Gönder"
                className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-white disabled:opacity-40 transition-opacity"
                style={{ background: "#0C447C" }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M4 12l16-8-6 16-2.5-6L4 12z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          </div>
        ) : (
          stateCard
        )}
        {footer}
      </div>
    </>
  );
}
