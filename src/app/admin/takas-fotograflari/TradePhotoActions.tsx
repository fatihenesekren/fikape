"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function TradePhotoActions({ photoId }: { photoId: number }) {
  const router = useRouter();
  const [loading, setLoading] = useState<"approve" | "reject" | null>(null);

  async function act(action: "approve" | "reject") {
    setLoading(action);
    try {
      const res = await fetch(`/api/admin/trade-photos/${photoId}`, {
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
