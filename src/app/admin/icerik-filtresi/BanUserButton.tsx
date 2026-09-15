"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ConfirmDialog } from "@/components/ConfirmDialog";

export function BanUserButton({ userId, count }: { userId: number; count: number }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  async function ban() {
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
      setConfirmOpen(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setConfirmOpen(true)}
        disabled={loading}
        className="shrink-0 text-xs font-semibold text-red-600 hover:underline disabled:opacity-60"
      >
        Kullanıcıyı Banla
      </button>

      <ConfirmDialog
        open={confirmOpen}
        title="Kullanıcıyı banla"
        description={`Bu kullanıcı ${count} kez içerik filtresine takıldı. Banlansın mı? Aktif takas ilanları da kapatılır.`}
        confirmLabel="Banla"
        loading={loading}
        onConfirm={ban}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  );
}
