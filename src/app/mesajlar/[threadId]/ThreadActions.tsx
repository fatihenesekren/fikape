"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ThreadActions({ threadId, showInterestLost }: { threadId: number; showInterestLost: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState<"block" | "interest-lost" | null>(null);

  async function endConversation() {
    setLoading("block");
    try {
      const res = await fetch(`/api/trades/threads/${threadId}/block`, { method: "POST" });
      if (res.ok) router.refresh();
    } finally {
      setLoading(null);
    }
  }

  // "İlgimi Kaybettim" — Görüşmeyi Sonlandır'dan farklı: mesajlaşmayı kapatmaz,
  // sadece karşı tarafa yumuşak bir sinyal gönderir (bkz. boşluk raporu).
  async function markInterestLost() {
    setLoading("interest-lost");
    try {
      const res = await fetch(`/api/trades/threads/${threadId}/interest-lost`, { method: "POST" });
      if (res.ok) router.refresh();
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="flex items-center gap-3">
      {showInterestLost && (
        <button
          onClick={markInterestLost}
          disabled={loading !== null}
          className="text-xs font-medium text-gray-400 hover:text-gray-600 disabled:opacity-60"
        >
          İlgimi Kaybettim
        </button>
      )}
      <button
        onClick={endConversation}
        disabled={loading !== null}
        className="text-xs font-medium text-gray-400 hover:text-gray-600 disabled:opacity-60"
      >
        Görüşmeyi Sonlandır
      </button>
    </div>
  );
}
