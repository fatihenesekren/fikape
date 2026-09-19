import type { SpecComparisonRow } from "@/lib/compare/buildSpecComparisonRows";
import { zebraColumnBg } from "@/lib/compare/zebraColumn";

// Birleşik tablonun spec satır grubu — kendi <table>'ı/legend'ı yok,
// UnifiedCompareTable'ın <tbody>'sine <tr>'ler döndürüyor. İki ayrı vurgu
// sistemi (yeşil "en iyi" / amber "farklı") ve zebra zemin mantığı aynen
// korunuyor.
export function SpecRows({ rows }: { rows: SpecComparisonRow[] }) {
  return (
    <>
      {rows.map((row) => (
        <tr key={row.label} className="border-b border-gray-100 last:border-0">
          <th
            scope="row"
            className="sticky left-0 bg-gray-50 text-left font-semibold text-gray-500 text-xs uppercase tracking-wide px-3 py-2.5"
          >
            {row.label}
          </th>
          {row.values.map((value, i) => {
            const isBest = row.bestIndices.includes(i);
            const isDifferent = row.kind === "categorical" && row.differentIndices.includes(i);
            return (
              <td
                key={i}
                className={`px-3 py-2.5 text-gray-900 ${
                  isBest ? "bg-emerald-50 font-semibold" : isDifferent ? "bg-amber-50" : zebraColumnBg(i)
                }`}
              >
                {value ?? <span className="text-gray-300">—</span>}
                {isBest && (
                  <span className="text-emerald-700 ml-1.5 font-bold" aria-hidden="true">✓</span>
                )}
                {isBest && <span className="sr-only">, en iyi değer</span>}
                {isDifferent && (
                  <span className="text-amber-800 ml-1.5 font-bold" aria-hidden="true">△</span>
                )}
                {isDifferent && <span className="sr-only">, farklı — tercihine bağlı</span>}
              </td>
            );
          })}
        </tr>
      ))}
    </>
  );
}
