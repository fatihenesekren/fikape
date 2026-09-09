"use client";

import { useState } from "react";

const REASON_LABEL: Record<string, string> = {
  SPAM: "İstenmeyen içerik",
  SCAM_ATTEMPT: "Dolandırıcılık şüphesi",
  OFFENSIVE: "Uygunsuz/hakaret içeriyor",
  OTHER: "Diğer",
};

// Mesaj raporu — görünüm ilan/araç sayfasındaki ReportContent modalıyla aynı
// (tetikleyici link + ortalanmış modal). Backend değişmedi: POST
// /api/trades/messages/[id]/report → MessageReport.
export function ReportButton({ messageId }: { messageId: number }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("SPAM");
  const [note, setNote] = useState("");
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (done && !open) {
    return <span className="text-[10px] text-gray-400">Rapor edildi</span>;
  }

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/trades/messages/${messageId}/report`, {
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
    <>
      <button
        onClick={() => { setError(null); setOpen(true); }}
        className="text-[10px] text-gray-400 hover:text-gray-600 transition-colors"
      >
        Rapor Et
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 px-4 py-6"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-md p-5 text-left"
            onClick={(e) => e.stopPropagation()}
          >
            {done ? (
              <div className="text-center py-4 space-y-2">
                <div className="text-2xl">✓</div>
                <p className="text-sm font-semibold text-gray-800">Raporunuz alındı, teşekkürler.</p>
                <button onClick={() => setOpen(false)} className="text-xs text-gray-400 hover:underline mt-2">Kapat</button>
              </div>
            ) : (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-gray-900">Mesajı bildir</h3>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">Sebep</label>
                  <select
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    aria-label="Rapor sebebi"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                  >
                    {Object.entries(REASON_LABEL).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">Açıklama (opsiyonel)</label>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={3}
                    maxLength={300}
                    placeholder="Örn: Site dışına yönlendiriyor, kapora istiyor."
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none"
                  />
                </div>

                {error && <p className="text-xs text-red-600">{error}</p>}

                <div className="flex items-center gap-2 justify-end">
                  <button onClick={() => setOpen(false)} className="text-xs text-gray-400 hover:underline px-2">Vazgeç</button>
                  <button
                    onClick={submit}
                    disabled={submitting}
                    className="px-4 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
                    style={{ background: "#111" }}
                  >
                    {submitting ? "Gönderiliyor..." : "Bildir"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
