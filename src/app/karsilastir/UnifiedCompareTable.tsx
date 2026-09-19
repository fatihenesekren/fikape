import { IdentityRow } from "./IdentityRow";
import { ScoreRows } from "./ScoreRows";
import { AiSummaryRow } from "./AiSummaryRow";
import { SpecRows } from "./SpecRows";
import type { CompareProductView } from "./CompareResultsGrid";
import type { SpecComparisonRow } from "@/lib/compare/buildSpecComparisonRows";
import { zebraColumnBg } from "@/lib/compare/zebraColumn";

// Sahibinden Oto360 referansına göre: TEK bir <table>, kimlik+skor+AI
// özeti+spec hepsi bu tablonun satır grupları — "1 aracın boydan boya bir
// kolonu var" hissi, ayrı kart/tablo bölümlerini hizalamaya çalışmak yerine
// gerçekten TEK bir yapı olduğu için doğal olarak sağlanıyor (bkz. proje
// geçmişi: önceki "zebra-sütun" yaklaşımı bunu TAKLİT ediyordu, bu artık
// gerçek). Mevcut yardımcılar (zebraColumnBg, en iyi/farklı rozetleri,
// sr-only mobil/masaüstü başlık deseni) hiçbiri yeniden yazılmadı, sadece
// farklı <tbody> gruplarına taşındı.
export function UnifiedCompareTable({
  products,
  specRows,
}: {
  products: CompareProductView[];
  specRows: SpecComparisonRow[];
}) {
  const productNames = products.map((p) => `${p.brandName} ${p.fullLabel}`);

  return (
    <div className="mt-6">
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
          className="w-full text-sm border-collapse table-fixed"
          aria-label={`${productNames.join(" ve ")} karşılaştırması`}
        >
          <thead>
            <tr>
              {/* table-fixed: sütun genişlikleri artık İÇERİĞE değil, bu ilk
                  satırdaki hücre genişliklerine göre belirleniyor (etiket
                  sütunu sabit, araç sütunları eşit paylaşım) — table-layout:auto
                  (varsayılan) tarayıcının sütun genişliğini hesaplamak için TÜM
                  hücre içeriğini taraması gerektiriyordu, araç sayısı arttıkça bu
                  bazı mobil tarayıcılarda sayfanın gerçek genişliğini yanlış
                  algılamasına (canlıda bulunan "araç sayısı arttıkça büyüyen
                  boşluk" hatası) katkı sağlıyor olabilirdi. */}
              {/* w-32: etiket hücrelerindeki whitespace-nowrap kaldırıldı (uzun
                  etiketler artık 2 satıra sarabiliyor) ama w-28 (112px) yine de
                  dar kalıyordu, w-32 (128px) rahat payı veriyor. */}
              <th scope="col" className="sr-only w-32">Özellik</th>
              {productNames.map((name, i) => (
                <th
                  key={i}
                  scope="col"
                  className={`${zebraColumnBg(i)} text-left text-xs font-bold text-gray-700 px-3 py-2 max-w-[160px] truncate sm:sr-only`}
                  title={name}
                >
                  {name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <IdentityRow products={products} />
            <ScoreRows products={products} />
            <AiSummaryRow products={products} />
            <SpecRows rows={specRows} />
          </tbody>
        </table>
      </div>
    </div>
  );
}
