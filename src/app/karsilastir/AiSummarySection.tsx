import { AiSummaryCard } from "@/components/AiSummaryCard";
import type { CompareProductView } from "./CompareResultsGrid";

export function AiSummarySection({ products }: { products: CompareProductView[] }) {
  return (
    <div className="mt-8">
      <h2 className="text-lg font-bold text-gray-900 mb-3">AI Özeti</h2>
      <div
        className="flex sm:grid gap-5 overflow-x-auto sm:overflow-visible snap-x snap-mandatory pb-2 sm:pb-0"
        style={{ gridTemplateColumns: `repeat(${products.length}, minmax(0, 1fr))` }}
      >
        {products.map((p) => (
          p.aiSummary ? (
            <div key={p.slug} className="min-w-[260px] sm:min-w-0 shrink-0 sm:shrink snap-start">
              <AiSummaryCard
                mode={p.aiSummary.mode}
                summaryText={p.aiSummary.summaryText}
                variant="compare"
                reviewCount={p.aiSummary.reviewCountAtGeneration ?? undefined}
              />
            </div>
          ) : (
            <div key={p.slug} className="rounded-2xl p-5 border border-gray-100 bg-gray-50 min-w-[260px] sm:min-w-0 shrink-0 sm:shrink snap-start">
              <p className="text-xs text-gray-400">Henüz özet yok.</p>
            </div>
          )
        ))}
      </div>
    </div>
  );
}
