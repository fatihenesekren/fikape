"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Onayda admin 0/1/2 kalite puanı seçer — bu puan approvedQualityScore olarak
// barem'e girer (§8 rubrik: 0=uyumlu ama sığ, 1=spesifik/model-doğru/faydalı,
// 2=istisnai derinlik). Ret'te kısa gerekçe zorunlu değil ama önerilir.
export function ExpertNoteActions({ noteId }: { noteId: number }) {
  const router = useRouter();
  const [mode, setMode] = useState<"idle" | "approve" | "reject">("idle");
  const [quality, setQuality] = useState<0 | 1 | 2>(1);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function send(body: object) {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/expert-notes/${noteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
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
      setLoading(false);
    }
  }

  if (mode === "approve") {
    return (
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-gray-500">Kalite:</span>
        {([0, 1, 2] as const).map((q) => (
          <button
            key={q}
            type="button"
            onClick={() => setQuality(q)}
            className={`w-7 h-7 rounded-full text-xs font-bold border ${
              quality === q ? "bg-gray-900 text-white border-gray-900" : "border-gray-200 text-gray-500"
            }`}
          >
            {q}
          </button>
        ))}
        <button
          onClick={() => send({ action: "approve", qualityScore: quality })}
          disabled={loading}
          className="text-xs font-semibold text-green-700 hover:underline disabled:opacity-60"
        >
          {loading ? "Onaylanıyor..." : "Onayla →"}
        </button>
        <button onClick={() => setMode("idle")} className="text-xs text-gray-400 hover:underline">vazgeç</button>
        {error && <span className="text-xs text-red-600 w-full">{error}</span>}
      </div>
    );
  }

  if (mode === "reject") {
    return (
      <div className="flex items-center gap-2 flex-wrap">
        <input
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Ret gerekçesi (opsiyonel)"
          className="text-xs border border-gray-200 rounded-lg px-2 py-1 flex-1 min-w-[160px]"
        />
        <button
          onClick={() => send({ action: "reject", reason })}
          disabled={loading}
          className="text-xs font-semibold text-red-600 hover:underline disabled:opacity-60"
        >
          {loading ? "Reddediliyor..." : "Reddet →"}
        </button>
        <button onClick={() => setMode("idle")} className="text-xs text-gray-400 hover:underline">vazgeç</button>
        {error && <span className="text-xs text-red-600 w-full">{error}</span>}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <button onClick={() => setMode("approve")} className="text-xs font-semibold text-green-700 hover:underline">Onayla</button>
      <button onClick={() => setMode("reject")} className="text-xs font-semibold text-gray-400 hover:underline">Reddet</button>
    </div>
  );
}
