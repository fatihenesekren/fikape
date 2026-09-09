"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function BanUserButton({ userId, count }: { userId: number; count: number }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function ban() {
    if (!confirm(`Bu kullanıcı ${count} kez içerik filtresine takıldı. Banlansın mı? Aktif takas ilanları da kapatılır.`)) {
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}/ban`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: `İçerik filtresi: ${count} tekrarlı ihlal` }),
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
      className="shrink-0 text-xs font-semibold text-red-600 hover:underline disabled:opacity-60"
    >
      Kullanıcıyı Banla
    </button>
  );
}
