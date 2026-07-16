"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { SOLD_REASONS, SOLD_REASON_LABEL, SOLD_TIME_SLOTS, SOLD_TIME_MONTHS_AGO } from "@/lib/soldReasons";
import { SaleLeadCard } from "./SaleLeadCard";

interface Props {
  productId: number;
  initialInGarage: boolean;
  initialIsSold: boolean;
  initialSoldReason: string | null;
  garageCount: number;
  isLoggedIn: boolean;
  defaultFullName: string;
  submittedSaleLeadTypes: ("EXPERTISE" | "QUICK_OFFER")[];
}

export function OwnershipCard({
  productId,
  initialInGarage,
  initialIsSold,
  initialSoldReason,
  garageCount,
  isLoggedIn,
  defaultFullName,
  submittedSaleLeadTypes,
}: Props) {
  const [inGarage, setInGarage]     = useState(initialInGarage);
  const [isSold, setIsSold]         = useState(initialIsSold);
  const [soldReason, setSoldReason] = useState(initialSoldReason);
  const [showSellForm, setShowSellForm] = useState(false);
  const [selectedReason, setSelectedReason] = useState("");
  const [selectedTimeSlot, setSelectedTimeSlot] = useState("now");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function addToGarage() {
    setLoading(true);
    await fetch("/api/garage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId }),
    });
    setInGarage(true);
    setIsSold(false);
    setSoldReason(null);
    setLoading(false);
    router.refresh();
  }

  async function removeFromGarage() {
    setLoading(true);
    setError(null);
    const res = await fetch("/api/garage", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Bir hata oluştu.");
      setLoading(false);
      return;
    }
    setInGarage(false);
    setIsSold(false);
    setSoldReason(null);
    setShowSellForm(false);
    setLoading(false);
    router.refresh();
  }

  async function confirmSell() {
    if (!selectedReason) return;
    setLoading(true);
    await fetch("/api/garage", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productId,
        action: "sell",
        soldReason: selectedReason,
        soldMonthsAgo: SOLD_TIME_MONTHS_AGO[selectedTimeSlot] ?? 0,
      }),
    });
    setInGarage(false);
    setIsSold(true);
    setSoldReason(selectedReason);
    setShowSellForm(false);
    setSelectedReason("");
    setSelectedTimeSlot("now");
    setLoading(false);
    router.refresh();
  }

  async function reactivate() {
    setLoading(true);
    await fetch("/api/garage", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, action: "reactivate" }),
    });
    setInGarage(true);
    setIsSold(false);
    setSoldReason(null);
    setLoading(false);
    router.refresh();
  }

  const iconBg  = isSold ? "#f3f4f6" : "#EAF3DE";
  const iconStroke = isSold ? "#9ca3af" : "#3B6D11";

  return (
    <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
      <div className="p-5 flex items-center flex-wrap gap-3">
        {/* İkon */}
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-colors"
          style={{ background: iconBg }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
            stroke={iconStroke} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
        </div>

        {/* Metin */}
        <div className="flex-1 min-w-[140px]">
          {isSold ? (
            <div>
              <p className="text-sm font-semibold text-gray-500">Geçmiş Araç</p>
              {soldReason && (
                <p className="text-xs text-gray-400 mt-0.5">
                  {SOLD_REASON_LABEL[soldReason] ?? soldReason}
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm font-semibold text-gray-900">
              Bu aracı kullanıyor musun?
              {garageCount > 0 && (
                <span className="text-xs font-normal text-gray-400 ml-2">
                  · {garageCount} kişinin garajında
                </span>
              )}
            </p>
          )}
        </div>

        {/* Butonlar */}
        <div className="shrink-0 flex items-center gap-2">
          {!isLoggedIn ? (
            <Link
              href="/giris"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white"
              style={{ background: "#111" }}
            >
              + Garajıma ekle
            </Link>
          ) : isSold ? (
            <button
              onClick={reactivate}
              disabled={loading}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold border border-gray-200 text-gray-600 hover:border-gray-400 transition-colors disabled:opacity-60"
            >
              Geri al
            </button>
          ) : inGarage ? (
            <>
              <button
                onClick={removeFromGarage}
                disabled={loading}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold border-2 transition-all disabled:opacity-60"
                style={{ background: "#EAF3DE", color: "#27500A", borderColor: "#C0DD97" }}
              >
                ✓ Garajımda
              </button>
              <button
                onClick={() => setShowSellForm((v) => !v)}
                disabled={loading}
                className="px-3 py-2 rounded-xl text-sm font-semibold border border-gray-200 text-gray-600 hover:border-gray-400 transition-colors disabled:opacity-60"
              >
                Sattım →
              </button>
            </>
          ) : (
            <button
              onClick={addToGarage}
              disabled={loading}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-60 transition-colors"
              style={{ background: "#111" }}
            >
              + Garajıma ekle
            </button>
          )}
        </div>
      </div>

      {error && <p className="px-5 pb-3 text-xs text-red-600">{error}</p>}

      {/* Satış formu */}
      {showSellForm && inGarage && (
        <div className="border-t border-gray-100 px-5 py-4 space-y-4">
          <SaleLeadCard
            productId={productId}
            defaultFullName={defaultFullName}
            submittedTypes={submittedSaleLeadTypes}
          />
          <div>
            <p className="text-sm font-semibold text-gray-800 mb-2">Ne zaman sattınız?</p>
            <div className="flex flex-wrap gap-2">
              {SOLD_TIME_SLOTS.map((s) => (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => setSelectedTimeSlot(s.key)}
                  className="px-3 py-2 rounded-xl text-sm font-semibold border-2 transition-all"
                  style={
                    selectedTimeSlot === s.key
                      ? { background: "#111", borderColor: "#111", color: "#fff" }
                      : { background: "#f9fafb", borderColor: "#e5e7eb", color: "#6b7280" }
                  }
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
          <p className="text-sm font-semibold text-gray-800">Bu aracı neden sattınız?</p>
          <div className="flex flex-wrap gap-2">
            {SOLD_REASONS.map((r) => (
              <button
                key={r.key}
                type="button"
                onClick={() => setSelectedReason(r.key)}
                className="px-3 py-2 rounded-xl text-sm font-semibold border-2 transition-all"
                style={
                  selectedReason === r.key
                    ? { background: "#111", borderColor: "#111", color: "#fff" }
                    : { background: "#f9fafb", borderColor: "#e5e7eb", color: "#6b7280" }
                }
              >
                {r.label}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => { setShowSellForm(false); setSelectedReason(""); }}
              className="px-4 py-2 rounded-xl text-sm font-semibold border border-gray-200 text-gray-600 hover:border-gray-400 transition-colors"
            >
              İptal
            </button>
            <button
              type="button"
              onClick={confirmSell}
              disabled={!selectedReason || loading}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-40 transition-colors"
              style={{ background: "#111" }}
            >
              {loading ? "Kaydediliyor..." : "Kaydet"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
