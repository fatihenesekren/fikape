"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function DeleteAccountSection({
  initialPendingRequest,
}: {
  initialPendingRequest: { dueAt: string } | null;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(initialPendingRequest);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function requestDeletion() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/account/deletion-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reason.trim() || null }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Bir hata oluştu.");
        return;
      }
      setPending({ dueAt: data.dueAt });
      setConfirmOpen(false);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function cancelRequest() {
    setLoading(true);
    try {
      const res = await fetch("/api/account/deletion-request", { method: "DELETE" });
      if (res.ok) {
        setPending(null);
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  if (pending) {
    const dueDate = new Date(pending.dueAt).toLocaleDateString("tr-TR");
    return (
      <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5 text-sm">
        <p className="font-semibold text-amber-800">Hesap silme talebiniz alındı.</p>
        <p className="text-amber-700 mt-1">
          KVKK gereği en geç {dueDate} tarihine kadar işleme alınacak. Fikrinizi değiştirirseniz iptal edebilirsiniz.
        </p>
        <button
          onClick={cancelRequest}
          disabled={loading}
          className="mt-3 text-xs font-semibold text-amber-800 hover:underline disabled:opacity-60"
        >
          Talebi iptal et
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5">
      <h2 className="text-sm font-bold text-gray-900 mb-1">Hesabımı Sil</h2>
      <p className="text-xs text-gray-500 mb-3">
        Hesabınız ve kişisel verileriniz (ad, e-posta) anonimleştirilir; aktif takas ilanlarınız kapatılır,
        takas mesajlarınız temizlenir. Bu işlem geri alınamaz.
      </p>
      {!confirmOpen ? (
        <button onClick={() => setConfirmOpen(true)} className="text-xs font-semibold text-red-600 hover:underline">
          Hesabımı silmek istiyorum
        </button>
      ) : (
        <div className="space-y-2">
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Neden ayrılıyorsunuz? (opsiyonel)"
            maxLength={500}
            rows={2}
            className="w-full text-sm rounded-lg border border-gray-200 px-2.5 py-1.5"
          />
          {error && <p className="text-xs text-red-600">{error}</p>}
          <div className="flex items-center gap-3">
            <button onClick={() => setConfirmOpen(false)} className="text-xs text-gray-400 hover:underline">Vazgeç</button>
            <button
              onClick={requestDeletion}
              disabled={loading}
              className="text-xs font-semibold text-red-600 hover:underline disabled:opacity-60"
            >
              {loading ? "Gönderiliyor..." : "Talebi Onayla"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
