"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ExpertOverride } from "@/generated/prisma/client";

export function ExpertOverrideActions({ profileId, adminOverride }: { profileId: number; adminOverride: ExpertOverride | null }) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  async function act(action: "force_featured" | "force_paused" | "clear") {
    setLoading(action);
    try {
      const res = await fetch(`/api/admin/expert-profiles/${profileId}/override`, {
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
    <div className="flex items-center gap-3 text-xs">
      <button
        onClick={() => act("force_featured")}
        disabled={loading !== null}
        className={`font-semibold hover:underline disabled:opacity-60 ${adminOverride === "FORCE_FEATURED" ? "text-green-700" : "text-gray-400"}`}
      >
        {loading === "force_featured" ? "…" : "Zorla göster"}
      </button>
      <button
        onClick={() => act("force_paused")}
        disabled={loading !== null}
        className={`font-semibold hover:underline disabled:opacity-60 ${adminOverride === "FORCE_PAUSED" ? "text-red-600" : "text-gray-400"}`}
      >
        {loading === "force_paused" ? "…" : "Zorla durdur"}
      </button>
      {adminOverride && (
        <button onClick={() => act("clear")} disabled={loading !== null} className="text-gray-400 hover:underline disabled:opacity-60">
          {loading === "clear" ? "…" : "override'ı kaldır"}
        </button>
      )}
    </div>
  );
}
