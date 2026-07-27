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
      aria-label="Favorilerden çıkar"
      className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors disabled:opacity-50 shrink-0"
    >
      <span className="text-amber-500" style={{ fontSize: 18 }}>{loading ? "…" : "★"}</span>
    </button>
  );
}
