"use client";

import { useState } from "react";

const REASON_LABEL: Record<string, string> = {
  SPAM: "İstenmeyen içerik",
  SCAM_ATTEMPT: "Dolandırıcılık şüphesi",
  OFFENSIVE: "Uygunsuz/hakaret içeriyor",
  OTHER: "Diğer",
};

export function ListingReportButton({ listingId }: { listingId: number }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("SPAM");
  const [note, setNote] = useState("");
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (done) return <p className="text-[11px] text-gray-400 mt-2">İlan raporunuz alındı, teşekkürler.</p>;

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="text-[11px] text-gray-400 hover:text-gray-600 mt-2">
        🚩 Bu ilanı bildir
      </button>
    );
  }

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/trades/${listingId}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason, note: note.trim() || null }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Bildirim gönderilemedi.");
        return;
      }
      setDone(true);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mt-2 border border-gray-100 rounded-lg p-2.5 space-y-1.5">
      <select
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        aria-label="Rapor sebebi"
        className="text-xs rounded-lg border border-gray-200 px-2 py-1 w-full"
      >
        {Object.entries(REASON_LABEL).map(([k, v]) => (
          <option key={k} value={k}>{v}</option>
        ))}
      </select>
      <input
        type="text"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Opsiyonel not"
        maxLength={300}
        className="text-xs rounded-lg border border-gray-200 px-2 py-1 w-full"
      />
      {error && <p className="text-[11px] text-red-600">{error}</p>}
      <div className="flex items-center gap-2">
        <button onClick={() => setOpen(false)} className="text-[11px] text-gray-400 hover:underline">Vazgeç</button>
        <button onClick={submit} disabled={submitting} className="text-[11px] font-semibold text-indigo-700 disabled:opacity-60">
          {submitting ? "Gönderiliyor..." : "Gönder"}
        </button>
      </div>
    </div>
  );
}
