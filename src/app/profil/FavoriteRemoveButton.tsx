"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function FavoriteRemoveButton({ productId }: { productId: number }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleRemove() {
    setLoading(true);
    await fetch("/api/favorites", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId }),
    });
    router.refresh();
  }

  return (
    <button
      onClick={handleRemove}
      disabled={loading}
      className="text-xs font-semibold text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50 shrink-0"
    >
      {loading ? "..." : "Çıkar"}
    </button>
  );
}
