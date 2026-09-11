"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface MessageView {
  id: number;
  text: string;
  isOwn: boolean;
  createdAt: string;
}

interface ContactFeedbackProps {
  expertProfileId: number;
  currentValue: boolean | null;
}

export function ExpertThreadView({
  threadId, counterpartName, expertHeadline, messages, contactFeedback,
}: {
  threadId: number;
  counterpartName: string;
  expertHeadline: string | null;
  messages: MessageView[];
  contactFeedback: ContactFeedbackProps | null;
}) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [blocked, setBlocked] = useState(false);
  const [feedbackValue, setFeedbackValue] = useState(contactFeedback?.currentValue ?? null);
  const [feedbackSending, setFeedbackSending] = useState(false);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (text.trim().length === 0) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/expert-message-threads/${threadId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Bir hata oluştu.");
        setLoading(false);
        return;
      }
      setText("");
      router.refresh();
    } catch {
      setError("Bağlantı hatası.");
    } finally {
      setLoading(false);
    }
  }

  async function block() {
    if (!confirm(`${counterpartName} kullanıcısını engellemek istediğinize emin misiniz?`)) return;
    const res = await fetch(`/api/expert-message-threads/${threadId}/block`, { method: "POST" });
    if (res.ok) setBlocked(true);
  }

  async function sendContactFeedback(isAccurate: boolean) {
    if (!contactFeedback || feedbackSending) return;
    setFeedbackSending(true);
    try {
      const res = await fetch(`/api/expert-profiles/${contactFeedback.expertProfileId}/contact-feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isAccurate }),
      });
      if (res.ok) setFeedbackValue(isAccurate);
    } finally {
      setFeedbackSending(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="mb-6 flex items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-black text-gray-900">{counterpartName}</h1>
          {expertHeadline && <p className="text-xs text-gray-400">{expertHeadline}</p>}
        </div>
        {!blocked && (
          <button onClick={block} className="text-xs text-red-600 hover:underline shrink-0">
            Engelle
          </button>
        )}
      </div>

      {contactFeedback && !blocked && (
        <div className="mb-4 bg-gray-50 rounded-xl px-3 py-2.5 flex items-center justify-between gap-2 flex-wrap">
          <p className="text-xs text-gray-500">İletişime geçtiğiniz telefon/adres bilgisi doğru muydu?</p>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              disabled={feedbackSending}
              onClick={() => sendContactFeedback(true)}
              className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                feedbackValue === true ? "bg-green-600 text-white" : "bg-white border border-gray-200 text-gray-600"
              }`}
            >
              Evet
            </button>
            <button
              type="button"
              disabled={feedbackSending}
              onClick={() => sendContactFeedback(false)}
              className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                feedbackValue === false ? "bg-red-600 text-white" : "bg-white border border-gray-200 text-gray-600"
              }`}
            >
              Hayır
            </button>
          </div>
        </div>
      )}

      <div className="space-y-2 mb-4">
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.isOwn ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[75%] rounded-xl px-3 py-2 text-sm ${m.isOwn ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-800"}`}>
              {m.text}
            </div>
          </div>
        ))}
      </div>

      {blocked ? (
        <p className="text-sm text-gray-400">Bu kullanıcıyı engellediniz.</p>
      ) : (
        <form onSubmit={send} className="flex items-start gap-2">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, 1000))}
            placeholder="Mesaj yazın…"
            className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-gray-400"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50 shrink-0"
            style={{ background: "#111" }}
          >
            {loading ? "…" : "Gönder"}
          </button>
        </form>
      )}
      {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
    </div>
  );
}
