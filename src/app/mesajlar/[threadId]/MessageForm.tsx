"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function MessageForm({ threadId }: { threadId: number }) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (submitting) return;
    const value = text.trim();
    if (!value) return;
    setError(null);
    setSubmitting(true);
    setText("");
    try {
      const res = await fetch(`/api/trades/threads/${threadId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: value }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Bir hata oluştu.");
        setText(value);
        return;
      }
      router.refresh();
    } catch {
      setError("Bir hata oluştu, tekrar deneyiniz.");
      setText(value);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="sticky bottom-0 bg-white border-t border-gray-100 p-3 space-y-1.5">
      {error && <p className="text-xs text-red-600">{error}</p>}
      <div className="flex gap-2">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Mesajınızı yazınız..."
          rows={1}
          maxLength={1000}
          className="flex-1 text-sm rounded-lg border border-gray-200 px-3 py-2 resize-none"
        />
        <button
          onClick={submit}
          disabled={submitting}
          className="text-sm font-semibold px-4 py-2 rounded-lg text-white disabled:opacity-60 shrink-0"
          style={{ background: "#4338ca" }}
        >
          Gönder
        </button>
      </div>
    </div>
  );
}
