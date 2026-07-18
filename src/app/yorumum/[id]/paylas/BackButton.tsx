"use client";

import { useRouter } from "next/navigation";

export function BackButton() {
  const router = useRouter();

  function handleClick() {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push("/profil");
    }
  }

  return (
    <button
      onClick={handleClick}
      className="text-sm text-gray-400 hover:text-gray-700 transition-colors"
    >
      ← Geri dön
    </button>
  );
}
