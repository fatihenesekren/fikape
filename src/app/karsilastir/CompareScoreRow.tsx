import Link from "next/link";
import { FIKAPE } from "@/lib/fikape";
import type { CompareProductView } from "./CompareResultsGrid";
import { zebraColumnBg } from "@/lib/compare/zebraColumn";

// Skor karşılaştırması artık kart-içi dikey bar seti değil, spec tablosuyla aynı
// satır-bazlı desende: her metrik bir satır, araçlar sütun. Göz için "hangi araç
// hangi metrikte önde" sorusunu tek bakışta cevaplıyor — kart-içi bar'da kullanıcı
// iki kartı zihinsel olarak üst üste bindirmek zorundaydı (bkz. veri görselleştirme
// denetimi). FikapeScore component'i (paylaşılan, /araclar/[slug] vb.'de kullanılıyor)
// buna göre değiştirilmedi — sadece src/lib/fikape.ts'teki FIKAPE sabiti reuse edildi.
function scoreValue(agg: CompareProductView["agg"], key: string): number {
  if (key === "scoreFiyat") return agg.fi;
  if (key === "scoreKalite") return agg.ka;
  return agg.pe;
}

export function CompareScoreRow({ products }: { products: CompareProductView[] }) {
  const overalls = products.map((p) => (p.agg.count > 0 ? p.agg.avg : null));
  const presentOveralls = overalls.filter((v): v is number => v !== null);
  // En az 2 karşılaştırılabilir değer yoksa "en yüksek" ilan edilmiyor — tek
  // araçta yorum varken diğerleri boşsa, o tek değeri "kazanan" gibi işaretlemek
  // yanıltıcı (canlıda bulunan gerçek hata — spec tablosundaki aynı kural burada
  // eksikti).
  const maxOverall = presentOveralls.length >= 2 ? Math.max(...presentOveralls) : null;
  const overallTie = maxOverall !== null && presentOveralls.filter((v) => v === maxOverall).length > 1;

  const unscored = products.filter((p) => p.agg.count === 0);

  return (
    <div className="mt-8">
      <h2 className="text-lg font-bold text-gray-900 mb-3">Kullanıcı Puanı</h2>
      <div className="overflow-x-auto border border-gray-100 rounded-2xl">
        <table className="w-full text-sm border-collapse" aria-label="Kullanıcı puanı karşılaştırması">
          <thead>
            <tr className="border-b border-gray-200">
              <th scope="col" className="sticky left-0 bg-gray-50 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide px-3 py-2 whitespace-nowrap">
                Kriter
              </th>
              {products.map((p, i) => (
                <th
                  key={p.slug}
                  scope="col"
                  className={`${zebraColumnBg(i)} text-left text-xs font-bold text-gray-700 px-3 py-2 max-w-[160px] truncate sm:sr-only`}
                  title={`${p.brandName} ${p.fullLabel}`}
                >
                  {p.brandName} {p.fullLabel}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-gray-100">
              <th scope="row" className="sticky left-0 bg-gray-50 text-left font-semibold text-gray-500 text-xs uppercase tracking-wide px-3 py-2.5 whitespace-nowrap">
                Genel Skor
              </th>
              {products.map((p, i) => {
                const overall = overalls[i];
                const isBest = overall !== null && overall === maxOverall && !overallTie;
                return (
                  <td key={p.slug} className={`px-3 py-2.5 ${isBest ? "bg-emerald-50" : zebraColumnBg(i)}`}>
                    {overall !== null ? (
                      <span className="inline-flex items-baseline gap-1">
                        <span className="text-xl font-black text-gray-900">{overall.toFixed(1)}</span>
                        <span className="text-xs text-gray-400">/10</span>
                        {isBest && <span className="text-emerald-700 font-bold ml-1" aria-hidden="true">✓</span>}
                        {isBest && <span className="sr-only">, en yüksek puan</span>}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">Henüz yorum yok</span>
                    )}
                  </td>
                );
              })}
            </tr>

            {FIKAPE.map(({ key, label, color }) => {
              const values = products.map((p) => (p.agg.count > 0 ? scoreValue(p.agg, key) : null));
              const present = values.filter((v): v is number => v !== null);
              const max = present.length >= 2 ? Math.max(...present) : null;
              const tie = max !== null && present.filter((v) => v === max).length > 1;
              return (
                <tr key={key} className="border-b border-gray-100 last:border-0">
                  <th scope="row" className="sticky left-0 bg-gray-50 text-left font-semibold text-gray-500 text-xs uppercase tracking-wide px-3 py-2.5 whitespace-nowrap">
                    {label}
                  </th>
                  {products.map((p, i) => {
                    const val = values[i];
                    const isBest = val !== null && val === max && !tie;
                    return (
                      <td key={p.slug} className={`px-3 py-2.5 ${isBest ? "bg-emerald-50" : zebraColumnBg(i)}`}>
                        {val !== null ? (
                          <div className="flex items-center gap-2 min-w-[100px]">
                            <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                              <div className="h-full rounded-full" style={{ width: `${(val / 10) * 100}%`, background: color }} />
                            </div>
                            <span className="text-xs font-bold w-7 text-right" style={{ color }}>{val.toFixed(1)}</span>
                            {isBest && <span className="text-emerald-700 font-bold" aria-hidden="true">✓</span>}
                            {isBest && <span className="sr-only">, en yüksek {label.toLowerCase()} puanı</span>}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-300">—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {unscored.length > 0 && (
        <p className="mt-2 text-xs text-gray-400">
          Henüz kullanıcı yorumu yok:{" "}
          {unscored.map((p, i) => (
            <span key={p.slug}>
              <Link href={`/yorum-yaz?arac=${p.slug}`} className="text-link font-semibold hover:underline">
                {p.brandName} {p.fullLabel} için ilk yorumu sen yaz
              </Link>
              {i < unscored.length - 1 ? " · " : ""}
            </span>
          ))}
        </p>
      )}
    </div>
  );
}
