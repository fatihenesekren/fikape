"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ListingBanButton({ reportId }: { reportId: number }) {
  const router = useRouter();
  const [loading, setLoading] = useState<"ban" | "dismiss" | "close_listing" | null>(null);

  async function act(action: "ban" | "dismiss" | "close_listing") {
    setLoading(action);
    try {
      const res = await fetch(`/api/admin/trade-listing-reports/${reportId}`, {
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
    <span className="inline-flex items-center gap-3">
      <button
        onClick={() => act("close_listing")}
        disabled={loading !== null}
        className="text-xs font-semibold text-gray-500 hover:underline disabled:opacity-60"
      >
        İlanı Kapat
      </button>
      <button
        onClick={() => act("ban")}
        disabled={loading !== null}
        className="text-xs font-semibold text-red-600 hover:underline disabled:opacity-60"
      >
        Kullanıcıyı Banla
      </button>
      <button
        onClick={() => act("dismiss")}
        disabled={loading !== null}
        className="text-xs font-semibold text-gray-400 hover:underline disabled:opacity-60"
      >
        Reddet
      </button>
    </span>
  );
}
