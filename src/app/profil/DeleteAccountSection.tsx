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
  const [open, setOpen] = useState(false);
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
      setOpen(false);
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
    <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
      <button
        type="button"
        onClick={() => { setOpen((v) => !v); setError(null); }}
        aria-expanded={open}
        className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left hover:bg-gray-50/60 transition-colors"
      >
        <span className="text-sm font-semibold text-gray-700">Hesabımı sil</span>
        <svg
          width="16" height="16" viewBox="0 0 24 24" fill="none"
          className={`text-gray-400 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden="true"
        >
          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      <div
        className={`grid transition-[grid-template-rows] duration-300 ease-out ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
      >
        <div className="overflow-hidden">
          <div className="px-5 pb-5 pt-0 border-t border-gray-100 space-y-3">
            <p className="text-xs text-gray-500 leading-relaxed mt-3">
              Hesabınız ve kişisel verileriniz (ad, e-posta) anonimleştirilir; aktif takas ilanlarınız
              kapatılır, takas mesajlarınız temizlenir. Yorumlarınız anonim olarak sitede kalır.
              <span className="font-semibold text-gray-600"> Bu işlem geri alınamaz.</span>
            </p>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Neden ayrılıyorsunuz? (opsiyonel)"
              maxLength={500}
              rows={2}
              className="w-full text-sm rounded-lg border border-gray-200 px-3 py-2 resize-none focus:outline-none focus:border-gray-400"
            />
            {error && <p className="text-xs text-red-600">{error}</p>}
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setOpen(false)}
                className="text-xs text-gray-400 hover:underline px-2"
              >
                Vazgeç
              </button>
              <button
                onClick={requestDeletion}
                disabled={loading}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-60 transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {loading ? "Gönderiliyor..." : "Hesabımı silmek istiyorum"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
