"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Chip } from "@/lib/chips";
import { validateDetailShort } from "@/lib/reviewValidation";

function ProConChipSelector({
  chips, pros, cons, onTogglePro, onToggleCon,
}: {
  chips: Chip[];
  pros: string[];
  cons: string[];
  onTogglePro: (key: string) => void;
  onToggleCon: (key: string) => void;
}) {
  const proAtMax = pros.length >= 3;
  const conAtMax = cons.length >= 3;

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <p className="text-xs font-bold flex items-center justify-between" style={{ color: "#16a34a" }}>
          <span>+ Artılar</span>
          <span className="text-gray-400 font-normal">{pros.length}/3</span>
        </p>
        <div className="flex flex-wrap gap-1.5">
          {chips.map((c) => {
            const isPro = pros.includes(c.key);
            const blocked = cons.includes(c.key) || (proAtMax && !isPro);
            return (
              <button
                key={`pro-${c.key}`}
                type="button"
                onClick={() => !blocked && onTogglePro(c.key)}
                className="px-2.5 py-1 rounded-full text-xs font-semibold border transition-all"
                style={
                  isPro
                    ? { background: "#dcfce7", borderColor: "#86efac", color: "#16a34a" }
                    : blocked
                    ? { background: "#f9fafb", borderColor: "#e5e7eb", color: "#d1d5db", cursor: "default" }
                    : { background: "#f9fafb", borderColor: "#e5e7eb", color: "#6b7280" }
                }
              >
                {c.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-bold flex items-center justify-between" style={{ color: "#dc2626" }}>
          <span>− Eksiler</span>
          <span className="text-gray-400 font-normal">{cons.length}/3</span>
        </p>
        <div className="flex flex-wrap gap-1.5">
          {chips.map((c) => {
            const isCon = cons.includes(c.key);
            const blocked = pros.includes(c.key) || (conAtMax && !isCon);
            return (
              <button
                key={`con-${c.key}`}
                type="button"
                onClick={() => !blocked && onToggleCon(c.key)}
                className="px-2.5 py-1 rounded-full text-xs font-semibold border transition-all"
                style={
                  isCon
                    ? { background: "#fee2e2", borderColor: "#fca5a5", color: "#dc2626" }
                    : blocked
                    ? { background: "#f9fafb", borderColor: "#e5e7eb", color: "#d1d5db", cursor: "default" }
                    : { background: "#f9fafb", borderColor: "#e5e7eb", color: "#6b7280" }
                }
              >
                {c.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

interface Props {
  reviewId: number;
  productSlug: string;
  chips: Chip[];
  initialPros: string[];
  initialCons: string[];
  initialDetailText: string;
  initialWouldBuyAgain: boolean | null;
}

export function UpdateReviewForm({
  reviewId,
  productSlug,
  chips,
  initialPros,
  initialCons,
  initialDetailText,
  initialWouldBuyAgain,
}: Props) {
  const router = useRouter();
  const [pros, setPros] = useState<string[]>(initialPros);
  const [cons, setCons] = useState<string[]>(initialCons);
  const [detailText, setDetailText] = useState(initialDetailText);
  const [wouldBuyAgain, setWouldBuyAgain] = useState<boolean | null>(initialWouldBuyAgain);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detailTouched, setDetailTouched] = useState(false);

  const detailValidation = validateDetailShort(detailText);
  const prosError = pros.length < 1 ? true : pros.length > 3;
  const consError = cons.length < 1 ? true : cons.length > 3;
  const canSubmit = !prosError && !consError && detailValidation.ok;

  function togglePro(key: string) {
    setPros((prev) => prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]);
  }
  function toggleCon(key: string) {
    setCons((prev) => prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]);
  }

  function goToProduct() {
    router.push(`/araclar/${productSlug}`);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);

    const res = await fetch(`/api/reviews/${reviewId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pros, cons, detailText, wouldBuyAgain }),
    });

    if (res.ok) {
      router.push(`/araclar/${productSlug}`);
      router.refresh();
    } else {
      const data = await res.json() as { error?: string };
      setError(data.error ?? "Bir hata oluştu.");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white border border-gray-100 rounded-2xl p-5 space-y-3">
        <p className="text-sm font-bold text-gray-900">Artılar & Eksiler</p>
        <ProConChipSelector chips={chips} pros={pros} cons={cons} onTogglePro={togglePro} onToggleCon={toggleCon} />
        {(pros.length < 1 || cons.length < 1) && (
          <p className="text-xs text-red-500">Her bölümden en az 1 seçin.</p>
        )}
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold text-gray-900">
            Yorumun <span className="text-gray-400 font-normal">(opsiyonel)</span>
          </p>
          <span className={`text-xs ${detailText.length >= 260 ? "text-orange-400" : "text-gray-400"}`}>
            {detailText.length}/280
          </span>
        </div>
        <textarea
          value={detailText}
          onChange={(e) => setDetailText(e.target.value.slice(0, 280))}
          onBlur={() => { if (detailText.trim()) setDetailTouched(true); }}
          rows={4}
          placeholder="Deneyimini birkaç cümleyle anlat..."
          className="w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none resize-none transition-colors"
          style={{ borderColor: detailTouched ? (detailValidation.ok ? "#86efac" : "#fca5a5") : "#e5e7eb" }}
        />
        {detailTouched && !detailValidation.ok && (
          <p className="text-xs text-red-500">{detailValidation.error}</p>
        )}
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl p-5 space-y-3">
        <p className="text-sm font-bold text-gray-900">
          Tekrar alır mısın? <span className="text-gray-400 font-normal">(opsiyonel)</span>
        </p>
        <div className="flex gap-3">
          {([true, false] as const).map((val) => (
            <button
              key={String(val)}
              type="button"
              onClick={() => setWouldBuyAgain(wouldBuyAgain === val ? null : val)}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all"
              style={
                wouldBuyAgain === val
                  ? val
                    ? { background: "#dcfce7", borderColor: "#86efac", color: "#16a34a" }
                    : { background: "#fee2e2", borderColor: "#fca5a5", color: "#dc2626" }
                  : { background: "#f9fafb", borderColor: "#e5e7eb", color: "#6b7280" }
              }
            >
              {val ? "👍 Alırım" : "👎 Almam"}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="text-sm text-red-500 text-center">{error}</p>}

      <div className="space-y-2">
        <button
          type="submit"
          disabled={submitting || !canSubmit}
          className="w-full py-3 rounded-xl text-sm font-bold text-white transition-colors disabled:opacity-50"
          style={{ background: "#111" }}
        >
          {submitting ? "Kaydediliyor..." : "Güncelle"}
        </button>
        <button
          type="button"
          onClick={goToProduct}
          className="w-full py-3 rounded-xl text-sm font-semibold border-2 border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors"
        >
          Görüşüm değişmedi
        </button>
      </div>
    </form>
  );
}
