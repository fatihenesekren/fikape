import type { DecisionBadge } from "@/lib/compare/buildDecisionSummary";

export function DecisionSummaryStrip({ badges }: { badges: DecisionBadge[] }) {
  if (badges.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 mt-6 mb-2">
      {badges.map((b) => (
        <span
          key={b.label}
          className="inline-flex items-center gap-1.5 text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-full px-3 py-1.5"
        >
          <span aria-hidden="true">✓</span>
          {b.label}: <span className="font-bold">{b.vehicleLabel}</span>
        </span>
      ))}
    </div>
  );
}
