"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function DeleteReviewButton({ reviewId }: { reviewId: number }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    setLoading(true);
    await fetch(`/api/reviews/${reviewId}`, { method: "DELETE" });
    setLoading(false);
    setConfirming(false);
    router.refresh();
  }

  if (confirming) {
    return (
      <span className="inline-flex items-center gap-2">
        <span className="text-xs text-gray-500">Silmek istediğinize emin misiniz?</span>
        <button
          onClick={handleDelete}
          disabled={loading}
          className="text-xs font-semibold text-red-500 hover:text-red-700 disabled:opacity-50 transition-colors"
        >
          {loading ? "Siliniyor..." : "Evet, sil"}
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="text-xs font-semibold text-gray-400 hover:text-gray-600 transition-colors"
        >
          İptal
        </button>
      </span>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="text-xs font-semibold text-gray-400 hover:text-red-500 transition-colors"
    >
      Sil
    </button>
  );
}
