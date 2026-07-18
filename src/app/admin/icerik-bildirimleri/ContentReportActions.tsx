"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ContentReportActions({ reportId }: { reportId: number }) {
  const router = useRouter();
  const [loading, setLoading] = useState<"RESOLVED" | "REJECTED" | null>(null);

  async function setStatus(status: "RESOLVED" | "REJECTED") {
    setLoading(status);
    try {
      const res = await fetch(`/api/admin/content-reports/${reportId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) router.refresh();
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={() => setStatus("RESOLVED")}
        disabled={loading !== null}
        className="text-xs font-semibold text-green-700 hover:underline disabled:opacity-60"
      >
        {loading === "RESOLVED" ? "İşaretleniyor..." : "Çözüldü"}
      </button>
      <button
        onClick={() => setStatus("REJECTED")}
        disabled={loading !== null}
        className="text-xs font-semibold text-gray-400 hover:underline disabled:opacity-60"
      >
        {loading === "REJECTED" ? "İşaretleniyor..." : "Reddet"}
      </button>
    </div>
  );
}
