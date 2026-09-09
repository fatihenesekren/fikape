"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ReopenButton({ threadId }: { threadId: number }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function reopen() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/trades/threads/${threadId}/reopen`, { method: "POST" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Görüşme yeniden açılamadı.");
        return;
      }
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <span className="inline-flex flex-col items-center gap-1">
      <button
        type="button"
        onClick={reopen}
        disabled={loading}
        className="text-xs font-semibold text-link hover:text-link-deep disabled:opacity-60 transition-colors"
      >
        {loading ? "Açılıyor..." : "Görüşmeyi yeniden aç"}
      </button>
      {error && <span className="text-[11px] text-red-600">{error}</span>}
    </span>
  );
}
