"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  productId: number;
  initialInGarage: boolean;
}

export function GarageButton({ productId, initialInGarage }: Props) {
  const [inGarage, setInGarage] = useState(initialInGarage);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function toggle() {
    setLoading(true);
    const method = inGarage ? "DELETE" : "POST";
    await fetch("/api/garage", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId }),
    });
    setInGarage((v) => !v);
    setLoading(false);
    router.refresh();
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all disabled:opacity-60"
      style={
        inGarage
          ? { background: "#EAF3DE", color: "#27500A", borderColor: "#27500A" }
          : { background: "#fff", color: "#555", borderColor: "#e5e7eb" }
      }
    >
      {inGarage ? "✓ Garajımda" : "🚗 Bu araç benim"}
    </button>
  );
}
