"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function BanButton({ reportId }: { reportId: number }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function ban() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/message-reports/${reportId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "ban" }),
      });
      if (res.ok) router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={ban}
      disabled={loading}
      className="text-xs font-semibold text-red-600 hover:underline disabled:opacity-60"
    >
      Kullanıcıyı Banla
    </button>
  );
}

export function UnbanButton({ userId }: { userId: number }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function unban() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}/unban`, { method: "POST" });
      if (res.ok) router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={unban}
      disabled={loading}
      className="text-xs font-semibold text-indigo-700 hover:underline disabled:opacity-60"
    >
      Banı Kaldır
    </button>
  );
}
