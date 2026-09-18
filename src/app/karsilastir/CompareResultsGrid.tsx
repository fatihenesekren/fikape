import { StickyCompareHeader } from "./StickyCompareHeader";
import { VehicleIdentityCard } from "./VehicleIdentityCard";
import { CompareScoreRow } from "./CompareScoreRow";
import { SpecComparisonTable } from "./SpecComparisonTable";
import { AiSummarySection } from "./AiSummarySection";
import { DecisionSummaryStrip } from "./DecisionSummaryStrip";
import type { SpecComparisonRow } from "@/lib/compare/buildSpecComparisonRows";
import { buildDecisionSummary } from "@/lib/compare/buildDecisionSummary";

export interface CompareProductView {
  slug: string;
  imageUrl: string | null;
  brandName: string;
  displayName: string; // trim-aware versiyon adı (örn. trimSplit.version ya da stripModelGenRange(model.name))
  subtitle: string | null; // donanım adı ya da ham trimName, yoksa null
  fullLabel: string; // displayName + donanım tek satırda birleşik — chip/sticky header/karar rozeti gibi tek satırlık bağlamlar için (aynı model+yıl'a sahip farklı donanımları ayırt eder)
  altText: string; // görsel alt metni (marka + sadeleştirilmiş model adı)
  year: number | null;
  agg: { avg: number; count: number; fi: number; ka: number; pe: number };
  aiSummary: { mode: "SINGLE_CARD" | "REVIEWS_SUMMARY"; summaryText: string; reviewCountAtGeneration: number | null } | null;
}

// Sonuç bölümünün orkestratörü — veri çekme page.tsx'te kalıyor, burası sadece
// zaten hazırlanmış CompareProductView[]'ı alıp dört alt bölümü (sticky özet,
// kimlik kartları, spec tablosu, AI özeti) sıralıyor. page.tsx'i küçük tutmak ve
// her bölümü bağımsız test edilebilir kılmak için ayrıldı (davranış değişikliği
// YOK — mevcut JSX'in birebir taşınmış hali).
export function CompareResultsGrid({
  products,
  specRows,
}: {
  products: CompareProductView[];
  specRows: SpecComparisonRow[];
}) {
  if (products.length < 2) return null;

  const powerRow = specRows.find((r) => r.label === "Güç");
  const decisionBadges = buildDecisionSummary(
    products.map((p) => ({
      label: `${p.brandName} ${p.fullLabel}`,
      overall: p.agg.count > 0 ? p.agg.avg : null,
      priceScore: p.agg.count > 0 ? p.agg.fi : null,
    })),
    powerRow
  );

  return (
    <>
      <StickyCompareHeader
        items={products.map((p) => ({
          slug: p.slug,
          name: `${p.brandName} ${p.fullLabel}`,
          overall: p.agg.count > 0 ? p.agg.avg : null,
        }))}
      />

      <div
        className="flex sm:grid gap-5 overflow-x-auto sm:overflow-visible snap-x snap-mandatory pb-2 sm:pb-0"
        style={{ gridTemplateColumns: `repeat(${products.length}, minmax(0, 1fr))` }}
      >
        {products.map((p) => (
          <VehicleIdentityCard key={p.slug} product={p} />
        ))}
      </div>

      <DecisionSummaryStrip badges={decisionBadges} />

      <CompareScoreRow products={products} />
      <SpecComparisonTable rows={specRows} productNames={products.map((p) => `${p.brandName} ${p.fullLabel}`)} />
      <AiSummarySection products={products} />
    </>
  );
}
