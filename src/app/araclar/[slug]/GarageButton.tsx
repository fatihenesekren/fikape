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
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function toggle() {
    setLoading(true);
    setError(null);
    const method = inGarage ? "DELETE" : "POST";
    const res = await fetch("/api/garage", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Bir hata oluştu.");
      setLoading(false);
      return;
    }
    setInGarage((v) => !v);
    setLoading(false);
    router.refresh();
  }

  return (
    <div>
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
      {error && <p className="mt-1.5 text-xs text-red-600 text-center">{error}</p>}
    </div>
  );
}
