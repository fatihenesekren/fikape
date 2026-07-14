"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ThreadActions({ threadId }: { threadId: number }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function endConversation() {
    setLoading(true);
    try {
      const res = await fetch(`/api/trades/threads/${threadId}/block`, { method: "POST" });
      if (res.ok) router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={endConversation}
      disabled={loading}
      className="text-xs font-medium text-gray-400 hover:text-gray-600 disabled:opacity-60"
    >
      Görüşmeyi Sonlandır
    </button>
  );
}
