import { StickyCompareHeader } from "./StickyCompareHeader";
import { UnifiedCompareTable } from "./UnifiedCompareTable";
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

// Sonuç bölümünün orkestratörü — veri çekme page.tsx'te kalıyor, burası
// sticky özet şeridi + karar rozetleri + BİRLEŞİK tabloyu (kimlik+skor+AI
// özeti+spec, tek <table>) sıralıyor.
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

      <DecisionSummaryStrip badges={decisionBadges} />

      <UnifiedCompareTable products={products} specRows={specRows} />
    </>
  );
}
