"use client";

import { useState } from "react";
import { SCORE_LABELS } from "@/lib/fikape";

export function ScoreSelector({ label, short, color, bg, value, initialValue, onChange }: {
  label: string; short: string; color: string; bg: string;
  value: number; initialValue?: number; onChange: (v: number) => void;
}) {
  const [hovered, setHovered] = useState(0);
  const active = hovered || value;

  // Kaydedilmiş puandan farklıysa (düzenleme ekranında) küçük bir "eski → yeni" göstergesi
  const changed = initialValue != null && initialValue > 0 && active > 0 && active !== initialValue;
  const delta = changed ? active - initialValue! : 0;
  const deltaColor = delta > 0 ? "#16a34a" : delta < 0 ? "#dc2626" : "#6b7280";

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black"
            style={{ background: bg, color }}>
            {short}
          </span>
          <span className="text-sm font-semibold text-gray-700">{label}</span>
        </div>
        <div className="flex items-baseline gap-1.5 min-w-[90px] justify-end">
          {active > 0 ? (
            <>
              {changed && (
                <span className="text-xs font-semibold tabular-nums" style={{ color: deltaColor }}>
                  {initialValue!.toFixed(1)} →
                </span>
              )}
              <span className="text-3xl font-black leading-none" style={{ color }}>{active}</span>
              <span className="text-xs font-medium" style={{ color }}>{SCORE_LABELS[active]}</span>
            </>
          ) : (
            <span className="text-xs text-gray-300">Puan ver</span>
          )}
        </div>
      </div>
      <div className="flex gap-1" role="radiogroup" aria-label={`${label} puanı`}>
        {[1,2,3,4,5,6,7,8,9,10].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={n === value}
            aria-label={`${n} puan`}
            onClick={() => onChange(n)}
            onMouseEnter={() => setHovered(n)}
            onMouseLeave={() => setHovered(0)}
            className="flex-1 flex flex-col items-center gap-1"
          >
            <div
              className="w-full h-7 rounded-md transition-all duration-100"
              style={n <= active
                ? { background: color, opacity: 0.6 + (n / active) * 0.4 }
                : { background: "#f0f0f0" }}
            />
            <span className="text-[10px] font-bold transition-colors"
              style={n <= active ? { color } : { color: "#d1d5db" }}>
              {n}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
