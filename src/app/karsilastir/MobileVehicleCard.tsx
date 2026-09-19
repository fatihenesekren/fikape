import Image from "next/image";
import Link from "next/link";
import type { CompareProductView } from "./CompareResultsGrid";
import type { SpecComparisonRow } from "@/lib/compare/buildSpecComparisonRows";
import { FIKAPE } from "@/lib/fikape";

// Mobil karşılaştırma sayfasının kartı — TEK bir tablo yerine (masaüstünde
// olduğu gibi) her araç kendi TAM GENİŞLİK kartında, dikey akışta gösteriliyor
// (bkz. MobileCompareCarousel.tsx). Bu, "TEK birleşik tablo, 1 aracın boydan
// boya kolonu var" ilkesini BOZMUYOR — sadece "boydan boya kolon" mobilde
// yatay bir sütun yerine tam ekran bir kart oluyor; bir aracın TÜM bilgisi
// (kimlik+skor+AI özeti+spec) yine kesintisiz, tek bir dikey akışta.
//
// AI özeti burada HER ZAMAN AÇIK (accordion/toggle YOK) — kullanıcı daha
// önce "devamını oku değil, tam metin göster" demişti (bkz. proje geçmişi);
// kart artık tam genişlikte olduğu için metin zaten rahat sığıyor, kısaltmaya
// hiç gerek kalmadı.
export function MobileVehicleCard({
  product,
  index,
  specRows,
}: {
  product: CompareProductView;
  index: number;
  specRows: SpecComparisonRow[];
}) {
  const p = product;
  const overall = p.agg.count > 0 ? p.agg.avg : null;
  const summary = p.aiSummary;
  const muted = summary?.mode !== "REVIEWS_SUMMARY";

  return (
    <div className="border border-gray-100 rounded-2xl p-4 bg-white shadow-sm">
      {p.imageUrl && (
        <div className="relative w-full aspect-[4/3] mb-3 rounded-xl overflow-hidden bg-gray-50">
          <Image src={p.imageUrl} alt={p.altText} fill className="object-contain p-2" sizes="(max-width: 768px) 90vw, 320px" />
        </div>
      )}
      <div className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5 break-words">{p.brandName}</div>
      <Link href={`/araclar/${p.slug}`} className="font-bold text-gray-900 hover:underline text-base break-words">
        {p.displayName}{p.year ? ` ${p.year}` : ""}
      </Link>
      {p.subtitle && <p className="text-xs text-gray-400 mt-0.5 break-words">{p.subtitle}</p>}

      <div className="mt-4 space-y-2.5">
        {overall !== null ? (
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-gray-900">{overall.toFixed(1)}</span>
            <span className="text-xs text-gray-400">/10 ({p.agg.count} yorum)</span>
          </div>
        ) : (
          <Link
            href={`/yorum-yaz?arac=${p.slug}`}
            className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-link-soft text-link hover:bg-link-line transition-colors"
          >
            ✍️ İlk yorumu sen yaz
          </Link>
        )}
        {p.agg.count > 0 && FIKAPE.map(({ key, label, color }) => {
          const val = key === "scoreFiyat" ? p.agg.fi : key === "scoreKalite" ? p.agg.ka : p.agg.pe;
          return (
            <div key={key} className="flex items-center gap-2 text-xs">
              <span className="w-16 text-gray-400 shrink-0">{label}</span>
              <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${(val / 10) * 100}%`, background: color }} />
              </div>
              <span className="font-bold w-8 text-right shrink-0" style={{ color }}>{val.toFixed(1)}</span>
            </div>
          );
        })}
      </div>

      {summary && (
        <div className={`mt-4 rounded-2xl rounded-tl-sm border p-3 ${muted ? "bg-indigo-50/60 border-indigo-100" : "bg-purple-50 border-purple-100"}`}>
          <span
            className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full mb-1.5"
            style={{ background: muted ? "#E0E7FF" : "#6366F1", color: muted ? "#4F46E5" : "#fff" }}
          >
            {muted ? "🔮" : "💬"} {muted ? "AI İzlenimi" : `AI Yorum Özeti${summary.reviewCountAtGeneration ? ` (${summary.reviewCountAtGeneration} yorum)` : ""}`}
          </span>
          <p className="text-[13px] text-gray-700 leading-relaxed">{summary.summaryText}</p>
          <p className="text-[10px] text-amber-600 font-medium mt-1.5">{muted ? "gerçek yorum değildir" : "gerçek yorumlardan"}</p>
        </div>
      )}

      {/* Değer yoksa satırı GİZLEMİYORUZ — masaüstü SpecRows.tsx ile aynı
          davranış: "—" gösteriliyor (bkz. kullanıcı geri bildirimi, bu
          karşılaştırma amaçlı bir sayfa, hangi aracın hangi özelliği
          eksik/doldurulmamış olduğu da bir bilgi; satırı tamamen atlamak
          "bu özellik bu araçta yok" ile "veri girilmemiş"i ayırt
          edilemez kılıyordu). */}
      <div className="mt-4 divide-y divide-gray-100">
        {specRows.map((row) => {
          const value = row.values[index];
          const isBest = row.bestIndices.includes(index);
          const isDifferent = row.kind === "categorical" && row.differentIndices.includes(index);
          return (
            <div key={row.label} className="flex items-center justify-between gap-3 py-2 text-xs">
              <span className="text-gray-400 uppercase tracking-wide shrink-0">{row.label}</span>
              {value ? (
                <span className={`font-medium text-right break-words ${isBest ? "text-emerald-700" : isDifferent ? "text-amber-700" : "text-gray-900"}`}>
                  {value}{isBest && " ✓"}{isDifferent && " △"}
                </span>
              ) : (
                <span className="text-gray-300">—</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
