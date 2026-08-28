"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function BanButton({ reportId }: { reportId: number }) {
  const router = useRouter();
  const [loading, setLoading] = useState<"ban" | "delete_message" | null>(null);

  async function act(action: "ban" | "delete_message") {
    setLoading(action);
    try {
      const res = await fetch(`/api/admin/message-reports/${reportId}`, {
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
        onClick={() => act("delete_message")}
        disabled={loading !== null}
        className="text-xs font-semibold text-gray-500 hover:underline disabled:opacity-60"
      >
        Mesajı Sil
      </button>
      <button
        onClick={() => act("ban")}
        disabled={loading !== null}
        className="text-xs font-semibold text-red-600 hover:underline disabled:opacity-60"
      >
        Kullanıcıyı Banla
      </button>
    </span>
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
