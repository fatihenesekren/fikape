"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { SOLD_REASONS, SALE_TYPES, TRADE_EXTRA_DIRECTIONS, formatSoldReasons } from "@/lib/soldReasons";
import { SaleLeadCard } from "./SaleLeadCard";

type SaleType = "CASH" | "TRADE";
type TradeExtraDirection = "PAID_EXTRA" | "RECEIVED_EXTRA" | "EVEN";

function currentMonthStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

interface Props {
  productId: number;
  initialInGarage: boolean;
  initialIsSold: boolean;
  initialSoldReason: string[] | null;
  initialSoldReasonNote?: string | null;
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
  initialSoldReasonNote = null,
  garageCount,
  isLoggedIn,
  defaultFullName,
  submittedSaleLeadTypes,
}: Props) {
  const [inGarage, setInGarage]     = useState(initialInGarage);
  const [isSold, setIsSold]         = useState(initialIsSold);
  const [soldReason, setSoldReason] = useState(initialSoldReason);
  const [persistedNote, setPersistedNote] = useState(initialSoldReasonNote);
  const [showSellForm, setShowSellForm] = useState(false);
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
  const [soldReasonNote, setSoldReasonNote] = useState("");
  const [soldMonth, setSoldMonth] = useState(currentMonthStr());
  const [saleType, setSaleType] = useState<SaleType | "">("");
  const [salePrice, setSalePrice] = useState("");
  const [tradeExtraDirection, setTradeExtraDirection] = useState<TradeExtraDirection | "">("");
  const [tradeExtraAmount, setTradeExtraAmount] = useState("");
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
    setPersistedNote(null);
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
    setPersistedNote(null);
    setShowSellForm(false);
    setLoading(false);
    router.refresh();
  }

  function toggleReason(key: string) {
    setSelectedReasons((prev) =>
      prev.includes(key) ? prev.filter((r) => r !== key) : [...prev, key]
    );
  }

  async function confirmSell() {
    if (selectedReasons.length === 0 || !saleType) return;
    setError(null);
    setLoading(true);
    const res = await fetch("/api/garage", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productId,
        action: "sell",
        soldReason: selectedReasons,
        soldReasonNote: selectedReasons.includes("OTHER") ? soldReasonNote.trim() || null : null,
        soldMonth,
        saleType,
        salePrice: salePrice ? Number(salePrice) : null,
        tradeExtraDirection: saleType === "TRADE" && tradeExtraDirection ? tradeExtraDirection : null,
        tradeExtraAmount: saleType === "TRADE" && tradeExtraAmount ? Number(tradeExtraAmount) : null,
      }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Bir hata oluştu.");
      setLoading(false);
      return;
    }
    setInGarage(false);
    setIsSold(true);
    setSoldReason(selectedReasons);
    setPersistedNote(selectedReasons.includes("OTHER") ? soldReasonNote.trim() || null : null);
    setShowSellForm(false);
    setSelectedReasons([]);
    setSoldReasonNote("");
    setSoldMonth(currentMonthStr());
    setSaleType("");
    setSalePrice("");
    setTradeExtraDirection("");
    setTradeExtraAmount("");
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
    setPersistedNote(null);
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
              {soldReason && soldReason.length > 0 && (
                <p className="text-xs text-gray-400 mt-0.5">
                  {formatSoldReasons(soldReason, persistedNote)}
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
            <p className="text-sm font-semibold text-gray-800 mb-2">Ne zaman elden çıkardınız?</p>
            <input
              type="month"
              value={soldMonth}
              max={currentMonthStr()}
              onChange={(e) => setSoldMonth(e.target.value)}
              className="px-3 py-2 rounded-xl text-sm border-2 border-gray-200 text-gray-700 focus:outline-none focus:border-gray-400"
            />
          </div>
          <p className="text-sm font-semibold text-gray-800">Bu aracı neden sattınız? <span className="font-normal text-gray-400">(birden fazla seçebilirsiniz)</span></p>
          <div className="flex flex-wrap gap-2">
            {SOLD_REASONS.map((r) => (
              <button
                key={r.key}
                type="button"
                onClick={() => toggleReason(r.key)}
                className="px-3 py-2 rounded-xl text-sm font-semibold border-2 transition-all"
                style={
                  selectedReasons.includes(r.key)
                    ? { background: "#111", borderColor: "#111", color: "#fff" }
                    : { background: "#f9fafb", borderColor: "#e5e7eb", color: "#6b7280" }
                }
              >
                {r.label}
              </button>
            ))}
          </div>

          {selectedReasons.includes("OTHER") && (
            <input
              type="text"
              value={soldReasonNote}
              onChange={(e) => setSoldReasonNote(e.target.value)}
              placeholder="Farklı sebebinizi kısaca belirtin (opsiyonel)"
              maxLength={200}
              className="w-full px-3 py-2 rounded-xl text-sm border-2 border-gray-200 text-gray-700 focus:outline-none focus:border-gray-400"
            />
          )}

          <p className="text-sm font-semibold text-gray-800">Nasıl elden çıkardınız?</p>
          <div className="flex flex-wrap gap-2">
            {SALE_TYPES.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setSaleType(t.key)}
                className="px-3 py-2 rounded-xl text-sm font-semibold border-2 transition-all"
                style={
                  saleType === t.key
                    ? { background: "#111", borderColor: "#111", color: "#fff" }
                    : { background: "#f9fafb", borderColor: "#e5e7eb", color: "#6b7280" }
                }
              >
                {t.label}
              </button>
            ))}
          </div>

          {saleType && (
            <div>
              <p className="text-sm font-semibold text-gray-800 mb-2">
                {saleType === "TRADE" ? "Aracınızın takasta biçilen değeri (TL, opsiyonel)" : "Satış fiyatı (TL, opsiyonel)"}
              </p>
              <input
                type="number"
                inputMode="numeric"
                min={0}
                value={salePrice}
                onChange={(e) => setSalePrice(e.target.value)}
                placeholder="örn. 850000"
                className="w-full sm:w-56 px-3 py-2 rounded-xl text-sm border-2 border-gray-200 text-gray-700 focus:outline-none focus:border-gray-400"
              />
            </div>
          )}

          {saleType === "TRADE" && (
            <>
              <p className="text-sm font-semibold text-gray-800">Üstüne para durumu</p>
              <div className="flex flex-wrap gap-2">
                {TRADE_EXTRA_DIRECTIONS.map((d) => (
                  <button
                    key={d.key}
                    type="button"
                    onClick={() => setTradeExtraDirection(d.key)}
                    className="px-3 py-2 rounded-xl text-sm font-semibold border-2 transition-all"
                    style={
                      tradeExtraDirection === d.key
                        ? { background: "#111", borderColor: "#111", color: "#fff" }
                        : { background: "#f9fafb", borderColor: "#e5e7eb", color: "#6b7280" }
                    }
                  >
                    {d.label}
                  </button>
                ))}
              </div>

              {(tradeExtraDirection === "PAID_EXTRA" || tradeExtraDirection === "RECEIVED_EXTRA") && (
                <div>
                  <p className="text-sm font-semibold text-gray-800 mb-2">Tutar (TL)</p>
                  <input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    value={tradeExtraAmount}
                    onChange={(e) => setTradeExtraAmount(e.target.value)}
                    placeholder="örn. 150000"
                    className="w-full sm:w-56 px-3 py-2 rounded-xl text-sm border-2 border-gray-200 text-gray-700 focus:outline-none focus:border-gray-400"
                  />
                </div>
              )}
            </>
          )}

          <p className="text-xs text-gray-400 bg-gray-50 rounded-lg px-3 py-2">
            Bu bilgi yalnızca ortalama piyasa fiyatı hesaplaması için kullanılır, profilinizde gösterilmez.
          </p>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setShowSellForm(false);
                setSelectedReasons([]);
                setSoldReasonNote("");
                setSaleType("");
                setSalePrice("");
                setTradeExtraDirection("");
                setTradeExtraAmount("");
              }}
              className="px-4 py-2 rounded-xl text-sm font-semibold border border-gray-200 text-gray-600 hover:border-gray-400 transition-colors"
            >
              İptal
            </button>
            <button
              type="button"
              onClick={confirmSell}
              disabled={selectedReasons.length === 0 || !saleType || loading}
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
