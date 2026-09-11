"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ExpertStatus } from "@/generated/prisma/client";

export function ExpertApplicationActions({ profileId, status }: { profileId: number; status: ExpertStatus }) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function act(action: "approve" | "reject" | "promote") {
    setLoading(action);
    setError("");
    try {
      const res = await fetch(`/api/admin/expert-profiles/${profileId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
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

  return (
    <div className="flex items-center gap-3 flex-wrap">
      {status === "WAITLISTED" && (
        <button onClick={() => act("promote")} disabled={loading !== null} className="text-xs font-semibold text-blue-700 hover:underline disabled:opacity-60">
          {loading === "promote" ? "İşleniyor..." : "İncelemeye al"}
        </button>
      )}
      <button onClick={() => act("approve")} disabled={loading !== null} className="text-xs font-semibold text-green-700 hover:underline disabled:opacity-60">
        {loading === "approve" ? "Onaylanıyor..." : "Onayla (ACTIVE)"}
      </button>
      <button onClick={() => act("reject")} disabled={loading !== null} className="text-xs font-semibold text-red-600 hover:underline disabled:opacity-60">
        {loading === "reject" ? "Reddediliyor..." : "Reddet"}
      </button>
      {error && <span className="text-xs text-red-600 w-full">{error}</span>}
    </div>
  );
}
