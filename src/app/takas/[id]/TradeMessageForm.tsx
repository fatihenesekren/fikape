"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function TradeMessageForm({ listingId }: { listingId: number }) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setError(null);
    if (text.trim().length < 1) {
      setError("Mesaj boş olamaz.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/trades/${listingId}/threads`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Bir hata oluştu.");
        return;
      }
      router.push(`/mesajlar/${data.threadId}`);
    } catch {
      setError("Bir hata oluştu, tekrar deneyiniz.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mt-4 space-y-2">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="İlgilendiğinizi belirtmek için bir mesaj yazınız..."
        rows={3}
        maxLength={1000}
        className="w-full text-sm rounded-lg border border-gray-200 px-3 py-2"
      />
      <button
        onClick={submit}
        disabled={submitting}
        className="text-sm font-semibold px-4 py-2 rounded-lg text-white disabled:opacity-60"
        style={{ background: "#4338ca" }}
      >
        {submitting ? "Gönderiliyor..." : "Mesaj Gönder"}
      </button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
