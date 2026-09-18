import type { SpecComparisonRow } from "@/lib/compare/buildSpecComparisonRows";

// İki ayrı vurgu sistemi, kasıtlı olarak hem renk hem şekil ile ayrışıyor
// (sadece renkle ayırmak renk körü kullanıcılar için yetersiz — bkz. erişilebilirlik
// denetimi): "en iyi değer" (sayısal, yön belli) yeşil dolu-tik; "farklı" (kategorik,
// yön yok ama önemli olabilir — örn. Hibrit vs Plug-in Hibrit) amber üçgen-ünlem.
// İkisi kullanıcının "kazanan" ile "sadece farklı, sen karar ver"i karıştırmaması
// için --fi/--ka/--pe/--link marka token ailesinden bilinçli olarak ayrı tutuluyor.
export function SpecComparisonTable({
  rows,
  productNames,
}: {
  rows: SpecComparisonRow[];
  productNames: string[];
}) {
  if (rows.length === 0) return null;

  return (
    <div className="mt-8">
      <h2 className="text-lg font-bold text-gray-900 mb-3">Teknik Özellikler</h2>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500 mb-2">
        <span className="inline-flex items-center gap-1">
          <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold">✓</span>
          En iyi değer
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">△</span>
          Farklı — tercihine bağlı
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="text-gray-300">—</span> Veri yok
        </span>
      </div>

      <div className="overflow-x-auto border border-gray-100 rounded-2xl">
        <table
          className="w-full text-sm border-collapse"
          aria-label={`${productNames.join(" ve ")} teknik özellik karşılaştırması`}
        >
          <thead>
            <tr>
              <th scope="col" className="sr-only">Özellik</th>
              {productNames.map((name, i) => (
                <th key={i} scope="col" className="sr-only">{name}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              return (
                <tr key={row.label} className="border-b border-gray-100 last:border-0">
                  <th
                    scope="row"
                    className="sticky left-0 bg-gray-50 text-left font-semibold text-gray-500 text-xs uppercase tracking-wide px-3 py-2.5 whitespace-nowrap"
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
                          isBest ? "bg-emerald-50 font-semibold" : isDifferent ? "bg-amber-50" : ""
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
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
