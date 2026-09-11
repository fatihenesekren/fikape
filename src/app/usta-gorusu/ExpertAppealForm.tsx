"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  subjectType: "NOTE_REJECTION" | "VISIBILITY_DECISION";
  noteId?: number;
  period?: string;
  existingStatus?: "PENDING" | "UPHELD" | "OVERTURNED" | "AUTO_FINALIZED" | null;
}

const STATUS_LABEL: Record<string, string> = {
  PENDING: "İtirazınız inceleniyor",
  UPHELD: "İtiraz incelendi — karar korundu",
  OVERTURNED: "İtiraz kabul edildi — karar gözden geçirildi",
  AUTO_FINALIZED: "İnceleme süresi doldu — karar kesinleşti",
};

export function ExpertAppealForm({ subjectType, noteId, period, existingStatus }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (existingStatus) {
    return <p className="text-xs text-gray-500 italic">{STATUS_LABEL[existingStatus] ?? existingStatus}</p>;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (reason.trim().length < 20) return setError("En az 20 karakter yazınız.");
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/expert-appeals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subjectType, noteId, period, reason: reason.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Bir hata oluştu.");
        setLoading(false);
        return;
      }
      router.refresh();
    } catch {
      setError("Bağlantı hatası.");
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="text-xs font-semibold text-gray-600 hover:text-gray-900 underline underline-offset-2">
        İtiraz et
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-2 mt-1">
      <textarea
        value={reason}
        onChange={(e) => setReason(e.target.value.slice(0, 1000))}
        rows={3}
        placeholder="Neden itiraz ettiğinizi kısaca açıklayın…"
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-gray-400 resize-y"
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
      <div className="flex items-center gap-2">
        <button type="submit" disabled={loading} className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white disabled:opacity-50" style={{ background: "#111" }}>
          {loading ? "Gönderiliyor…" : "Gönder"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="text-xs text-gray-400 hover:underline">vazgeç</button>
      </div>
    </form>
  );
}
