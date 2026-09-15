"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ConfirmDialog } from "@/components/ConfirmDialog";

export function DeletionRequestActions({ requestId }: { requestId: number }) {
  const router = useRouter();
  const [loading, setLoading] = useState<"approve" | "reject" | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  async function act(action: "approve" | "reject") {
    setLoading(action);
    try {
      const res = await fetch(`/api/admin/deletion-requests/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (res.ok) router.refresh();
    } finally {
      setLoading(null);
      setConfirmOpen(false);
    }
  }

  return (
    <>
      <span className="inline-flex items-center gap-3">
        <button
          onClick={() => setConfirmOpen(true)}
          disabled={loading !== null}
          className="text-xs font-semibold text-red-600 hover:underline disabled:opacity-60"
        >
          Onayla ve Sil
        </button>
        <button
          onClick={() => act("reject")}
          disabled={loading !== null}
          className="text-xs font-semibold text-gray-400 hover:underline disabled:opacity-60"
        >
          Reddet
        </button>
      </span>

      <ConfirmDialog
        open={confirmOpen}
        title="Hesabı kalıcı olarak sil"
        description="Bu hesap kalıcı olarak anonimleştirilecek. Emin misiniz?"
        confirmLabel="Onayla ve Sil"
        loading={loading === "approve"}
        onConfirm={() => act("approve")}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  );
}
