"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Props {
  productId: number;
  initialInGarage: boolean;
  garageCount: number;
  isLoggedIn: boolean;
}

export function OwnershipCard({ productId, initialInGarage, garageCount, isLoggedIn }: Props) {
  const [inGarage, setInGarage] = useState(initialInGarage);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function toggle() {
    setLoading(true);
    await fetch("/api/garage", {
      method: inGarage ? "DELETE" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId }),
    });
    setInGarage((v) => !v);
    setLoading(false);
    router.refresh();
  }

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 flex items-center gap-4">
      <div className="w-11 h-11 rounded-xl bg-green-50 flex items-center justify-center shrink-0">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#3B6D11" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900">
          Bu aracı kullanıyor musun?
          {garageCount > 0 && (
            <span className="text-xs font-normal text-gray-400 ml-2">· {garageCount} kişinin garajında</span>
          )}
        </p>
      </div>

      {isLoggedIn ? (
        <button
          onClick={toggle}
          disabled={loading}
          className="shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold border transition-all disabled:opacity-60"
          style={
            inGarage
              ? { background: "#EAF3DE", color: "#27500A", borderColor: "#C0DD97" }
              : { background: "#111", color: "#fff", borderColor: "#111" }
          }
        >
          {inGarage ? "✓ Garajımda" : "+ Garajıma ekle"}
        </button>
      ) : (
        <Link
          href="/giris"
          className="shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold"
          style={{ background: "#111", color: "#fff" }}
        >
          + Garajıma ekle
        </Link>
      )}
    </div>
  );
}
