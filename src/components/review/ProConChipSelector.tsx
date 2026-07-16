"use client";

import type { Chip } from "@/lib/chips";

export function ProConChipSelector({ chips, pros, cons, onTogglePro, onToggleCon }: {
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
      {/* Artılar */}
      <div className="space-y-2">
        <p className="text-xs font-bold flex items-center justify-between" style={{ color: "#16a34a" }}>
          <span>+ Artılar</span>
          <span className="text-gray-400 font-normal">{pros.length}/3</span>
        </p>
        <div className="flex flex-wrap gap-1.5">
          {chips.map((c) => {
            const isPro = pros.includes(c.key);
            const isCon = cons.includes(c.key);
            const blocked = isCon || (proAtMax && !isPro);
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

      {/* Eksiler */}
      <div className="space-y-2">
        <p className="text-xs font-bold flex items-center justify-between" style={{ color: "#dc2626" }}>
          <span>− Eksiler</span>
          <span className="text-gray-400 font-normal">{cons.length}/3</span>
        </p>
        <div className="flex flex-wrap gap-1.5">
          {chips.map((c) => {
            const isCon = cons.includes(c.key);
            const isPro = pros.includes(c.key);
            const blocked = isPro || (conAtMax && !isCon);
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
