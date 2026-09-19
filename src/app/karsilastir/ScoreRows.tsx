import Link from "next/link";
import { FIKAPE } from "@/lib/fikape";
import type { CompareProductView } from "./CompareResultsGrid";
import { zebraColumnBg } from "@/lib/compare/zebraColumn";

// Birleşik tablonun bir satır grubu — kendi <table>'ı yok, UnifiedCompareTable'ın
// <tbody>'sine <tr>'ler döndürüyor. Skor karşılaştırması kart-içi dikey bar
// yerine satır-bazlı: her metrik bir satır, araçlar sütun. FikapeScore
// component'i (paylaşılan, /araclar/[slug] vb.) buna göre değiştirilmedi —
// sadece src/lib/fikape.ts'teki FIKAPE sabiti reuse edildi.
function scoreValue(agg: CompareProductView["agg"], key: string): number {
  if (key === "scoreFiyat") return agg.fi;
  if (key === "scoreKalite") return agg.ka;
  return agg.pe;
}

export function ScoreRows({ products }: { products: CompareProductView[] }) {
  const overalls = products.map((p) => (p.agg.count > 0 ? p.agg.avg : null));
  const presentOveralls = overalls.filter((v): v is number => v !== null);
  // En az 2 karşılaştırılabilir değer yoksa "en yüksek" ilan edilmiyor — tek
  // araçta yorum varken diğerleri boşsa, o tek değeri "kazanan" gibi işaretlemek
  // yanıltıcı.
  const maxOverall = presentOveralls.length >= 2 ? Math.max(...presentOveralls) : null;
  const overallTie = maxOverall !== null && presentOveralls.filter((v) => v === maxOverall).length > 1;

  return (
    <>
      <tr className="border-b border-gray-100">
        <th scope="row" className="sticky left-0 bg-gray-50 text-left font-semibold text-gray-500 text-xs uppercase tracking-wide px-3 py-2.5">
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
                  <span className="text-[11px] text-gray-400">({p.agg.count} yorum)</span>
                  {isBest && <span className="text-emerald-700 font-bold ml-1" aria-hidden="true">✓</span>}
                  {isBest && <span className="sr-only">, en yüksek puan</span>}
                </span>
              ) : (
                // Ayrı, sıkışık bir colSpan CTA satırı yerine (önceki tur —
                // görsel olarak zayıf bulundu) davet doğrudan aracın kendi
                // hücresinde — konum zaten hangi araca ait olduğunu gösteriyor.
                <Link
                  href={`/yorum-yaz?arac=${p.slug}`}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-link-soft text-link hover:bg-link-line transition-colors"
                >
                  ✍️ İlk yorumu sen yaz
                </Link>
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
          <tr key={key} className="border-b border-gray-100">
            <th scope="row" className="sticky left-0 bg-gray-50 text-left font-semibold text-gray-500 text-xs uppercase tracking-wide px-3 py-2.5">
              {label}
            </th>
            {products.map((p, i) => {
              const val = values[i];
              const isBest = val !== null && val === max && !tie;
              return (
                <td key={p.slug} className={`px-3 py-2.5 ${isBest ? "bg-emerald-50" : zebraColumnBg(i)}`}>
                  {/* min-w-[100px] DEĞİL: table-fixed altında dar sütunlarda
                      (3-4 araç, mobil) komşu hücreye taşardı (bkz. AiSummaryRow
                      yorumu — aynı hata sınıfı). */}
                  {val !== null ? (
                    <div className="flex items-center gap-2 w-full">
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
    </>
  );
}
