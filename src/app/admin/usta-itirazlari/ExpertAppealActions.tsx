"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ExpertAppealActions({ appealId }: { appealId: number }) {
  const router = useRouter();
  const [mode, setMode] = useState<"idle" | "decide">("idle");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState<"uphold" | "overturn" | null>(null);
  const [error, setError] = useState("");

  async function act(action: "uphold" | "overturn") {
    setLoading(action);
    setError("");
    try {
      const res = await fetch(`/api/admin/expert-appeals/${appealId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, decisionNote: note }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Bir hata oluştu.");
        setLoading(null);
        return;
      }
      router.refresh();
    } catch {
      setError("Bağlantı hatası.");
      setLoading(null);
    }
  }

  if (mode === "idle") {
    return (
      <button onClick={() => setMode("decide")} className="text-xs font-semibold text-gray-700 hover:underline">
        Karara bağla
      </button>
    );
  }

  return (
    <div className="space-y-2">
      <input
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Karar notu (opsiyonel, ustaya gönderilmez)"
        className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5"
      />
      <div className="flex items-center gap-3">
        <button onClick={() => act("overturn")} disabled={loading !== null} className="text-xs font-semibold text-green-700 hover:underline disabled:opacity-60">
          {loading === "overturn" ? "İşleniyor..." : "Kabul et (bozuldu)"}
        </button>
        <button onClick={() => act("uphold")} disabled={loading !== null} className="text-xs font-semibold text-gray-500 hover:underline disabled:opacity-60">
          {loading === "uphold" ? "İşleniyor..." : "Reddet (korundu)"}
        </button>
        <button onClick={() => setMode("idle")} className="text-xs text-gray-400 hover:underline">vazgeç</button>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
