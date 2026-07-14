"use client";

import { useState } from "react";

const REASON_LABEL: Record<string, string> = {
  SPAM: "İstenmeyen içerik",
  SCAM_ATTEMPT: "Dolandırıcılık şüphesi",
  OFFENSIVE: "Uygunsuz/hakaret içeriyor",
  OTHER: "Diğer",
};

export function ReportButton({ messageId }: { messageId: number }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("SPAM");
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (done) return <span className="text-[10px] text-gray-400">Rapor edildi</span>;

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="text-[10px] text-gray-400 hover:text-gray-600">
        Rapor Et
      </button>
    );
  }

  async function submit() {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/trades/messages/${messageId}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      if (res.ok) setDone(true);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <span className="inline-flex items-center gap-1">
      <select value={reason} onChange={(e) => setReason(e.target.value)} className="text-[10px] rounded border border-gray-200 px-1 py-0.5">
        {Object.entries(REASON_LABEL).map(([k, v]) => (
          <option key={k} value={k}>{v}</option>
        ))}
      </select>
      <button onClick={submit} disabled={submitting} className="text-[10px] font-semibold text-indigo-700">
        Gönder
      </button>
    </span>
  );
}
