"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function FavoriteButton({
  productId,
  initialFavorited,
  isLoggedIn,
  variant = "card",
}: {
  productId: number;
  initialFavorited: boolean;
  isLoggedIn: boolean;
  variant?: "card" | "detail";
}) {
  const router = useRouter();
  const [favorited, setFavorited] = useState(initialFavorited);
  const [loading, setLoading] = useState(false);

  async function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!isLoggedIn) {
      router.push("/giris");
      return;
    }
    if (loading) return;
    setLoading(true);
    const next = !favorited;
    setFavorited(next); // optimistic
    try {
      const res = await fetch("/api/favorites", {
        method: next ? "POST" : "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });
      if (!res.ok) setFavorited(!next); // geri al
    } catch {
      setFavorited(!next);
    } finally {
      setLoading(false);
    }
  }

  if (variant === "detail") {
    return (
      <button
        type="button"
        onClick={toggle}
        disabled={loading}
        aria-label={favorited ? "Favorilerden çıkar" : "Favorilere ekle"}
        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold border transition-colors disabled:opacity-60 ${
          favorited
            ? "bg-amber-50 border-amber-200 text-amber-700"
            : "border-gray-200 text-gray-600 hover:border-gray-400"
        }`}
      >
        {favorited ? "★ Favorilerde" : "☆ Favorilere ekle"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={loading}
      aria-label={favorited ? "Favorilerden çıkar" : "Favorilere ekle"}
      className="shrink-0 w-6 h-6 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
    >
      <span className={favorited ? "text-amber-500" : "text-gray-300"} style={{ fontSize: 16 }}>
        {favorited ? "★" : "☆"}
      </span>
    </button>
  );
}
