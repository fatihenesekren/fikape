"use client";

import { useState } from "react";

export function TradeRatingForm({ threadId, counterpartName }: { threadId: number; counterpartName: string }) {
  const [score, setScore] = useState(0);
  const [hoverScore, setHoverScore] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (done) {
    return (
      <div className="p-4 border-t border-gray-100 text-center text-xs text-gray-400">
        ✓ Değerlendirmeniz için teşekkürler.
      </div>
    );
  }

  async function submit() {
    if (score === 0) {
      setError("Lütfen bir puan seçiniz.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/trades/threads/${threadId}/rating`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ score, comment: comment.trim() || null }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Bir hata oluştu.");
        return;
      }
      setDone(true);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="p-4 border-t border-gray-100 bg-indigo-50/40">
      <p className="text-xs font-bold text-indigo-800 mb-2">
        {counterpartName} ile takasınız nasıldı? Değerlendirin.
      </p>
      <div className="flex items-center gap-1 mb-2" role="radiogroup" aria-label="Puan">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setScore(n)}
            onMouseEnter={() => setHoverScore(n)}
            onMouseLeave={() => setHoverScore(0)}
            aria-label={`${n} yıldız`}
            className="text-2xl leading-none"
          >
            {(hoverScore || score) >= n ? "★" : "☆"}
          </button>
        ))}
      </div>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Opsiyonel yorum"
        maxLength={300}
        rows={2}
        className="w-full text-sm rounded-lg border border-indigo-200 px-2.5 py-1.5 bg-white mb-2"
      />
      {error && <p className="text-xs text-red-600 mb-2">{error}</p>}
      <button
        onClick={submit}
        disabled={submitting}
        className="text-sm font-semibold px-3 py-1.5 rounded-lg text-white disabled:opacity-60"
        style={{ background: "#4338ca" }}
      >
        {submitting ? "Gönderiliyor..." : "Değerlendirmeyi Gönder"}
      </button>
    </div>
  );
}
