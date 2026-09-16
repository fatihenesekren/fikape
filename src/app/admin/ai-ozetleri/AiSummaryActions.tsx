"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AiSummaryActions({ summaryId }: { summaryId: number }) {
  const router = useRouter();
  const [loading, setLoading] = useState<"approve" | "reject" | "regenerate" | null>(null);

  async function act(action: "approve" | "reject" | "regenerate") {
    setLoading(action);
    try {
      const res = await fetch(`/api/admin/ai-vehicle-summaries/${summaryId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (res.ok) router.refresh();
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={() => act("regenerate")}
        disabled={loading !== null}
        className="text-xs font-semibold text-gray-500 hover:underline disabled:opacity-60"
      >
        {loading === "regenerate" ? "Üretiliyor..." : "Yeniden Üret"}
      </button>
      <button
        onClick={() => act("approve")}
        disabled={loading !== null}
        className="text-xs font-semibold text-green-700 hover:underline disabled:opacity-60"
      >
        {loading === "approve" ? "Onaylanıyor..." : "Onayla"}
      </button>
      <button
        onClick={() => act("reject")}
        disabled={loading !== null}
        className="text-xs font-semibold text-red-600 hover:underline disabled:opacity-60"
      >
        {loading === "reject" ? "Reddediliyor..." : "Reddet"}
      </button>
    </div>
  );
}
