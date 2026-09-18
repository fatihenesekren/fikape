import type { SpecComparisonRow } from "@/lib/compare/buildSpecComparisonRows";

export function SpecComparisonTable({ rows }: { rows: SpecComparisonRow[] }) {
  if (rows.length === 0) return null;

  return (
    <div className="mt-8">
      <h2 className="text-lg font-bold text-gray-900 mb-3">Teknik Özellikler</h2>
      <div className="overflow-x-auto border border-gray-100 rounded-2xl">
        <table className="w-full text-sm border-collapse">
          <tbody>
            {rows.map((row) => (
              <tr key={row.label} className="border-b border-gray-100 last:border-0">
                <th
                  scope="row"
                  className="sticky left-0 bg-gray-50 text-left font-semibold text-gray-500 text-xs uppercase tracking-wide px-3 py-2.5 whitespace-nowrap"
                >
                  {row.label}
                </th>
                {row.values.map((value, i) => {
                  const isBest = row.bestIndices.includes(i);
                  return (
                    <td
                      key={i}
                      className={`px-3 py-2.5 text-gray-900 ${isBest ? "bg-emerald-50 font-semibold" : ""}`}
                    >
                      {value ?? <span className="text-gray-300">—</span>}
                      {isBest && <span className="text-emerald-600 ml-1" aria-label="en iyi değer">✓</span>}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
