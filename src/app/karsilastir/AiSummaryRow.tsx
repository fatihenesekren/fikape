"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import type { CompareProductView } from "./CompareResultsGrid";
import { zebraColumnBg } from "@/lib/compare/zebraColumn";

type AiSummary = NonNullable<CompareProductView["aiSummary"]>;

function summaryLabel(summary: AiSummary): { title: string; prefix: string; muted: boolean; shortNote: string } {
  if (summary.mode === "REVIEWS_SUMMARY") {
    return {
      title: `AI Yorum Özeti${summary.reviewCountAtGeneration ? ` (${summary.reviewCountAtGeneration} yorum)` : ""}`,
      prefix: "Özet:",
      muted: false,
      shortNote: "gerçek yorumlardan",
    };
  }
  return { title: "AI İzlenimi", prefix: "İzlenim:", muted: true, shortNote: "gerçek yorum değildir" };
}

// Tablo satırı olarak (önceki turlarda ayrı mor-gradient kart olan) AI özeti —
// bir tabloya girince HTML kuralı gereği bir hücre "Devamını oku" ile açılırsa
// SATIRDAKİ TÜM hücreler o yüksekliğe zorla büyür (diğer araçlarda boş alan
// oluşur). Bunu önlemek için hücre HER ZAMAN line-clamp-2 sabit yükseklikte
// kalıyor, "Devamını oku" satır-içi genişletme yerine basit bir modal açıyor
// (3 uzman ajanın ortak sonucu — bkz. proje geçmişi). Şeffaflık ibaresi
// ("gerçek yorum değildir") her zaman kısaca görünür kalıyor, tam gerekçe
// modalda.
function AiSummaryCell({ summary, onExpand }: { summary: AiSummary; onExpand: () => void }) {
  const { title, prefix, muted, shortNote } = summaryLabel(summary);
  return (
    <div className="min-w-[160px] max-w-[220px]">
      <span
        className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full mb-1"
        style={{ background: muted ? "#E0E7FF" : "#6366F1", color: muted ? "#4F46E5" : "#fff" }}
      >
        🤖 {title}
      </span>
      <p className="text-xs text-gray-700 italic leading-relaxed line-clamp-2">
        <span className="not-italic font-semibold text-gray-500">{prefix}</span> {summary.summaryText}
      </p>
      <div className="flex items-center gap-2 mt-1">
        <button
          type="button"
          onClick={onExpand}
          className="text-xs font-semibold hover:underline"
          style={{ color: "#6366F1" }}
        >
          Devamını oku
        </button>
        <span className="text-[10px] text-gray-400">· {shortNote}</span>
      </div>
    </div>
  );
}

function AiSummaryModal({
  vehicleLabel,
  summary,
  onClose,
}: {
  vehicleLabel: string;
  summary: AiSummary;
  onClose: () => void;
}) {
  const { title, muted } = summaryLabel(summary);
  const caption = summary.mode === "REVIEWS_SUMMARY"
    ? "Bu araç için yazılan gerçek kullanıcı yorumlarının yapay zeka ile oluşturulmuş özetidir."
    : "Bu araç için henüz yeterli kullanıcı yorumu yok. Aşağıdaki metin, yapay zeka tarafından oluşturulmuş genel bir izlenimdir — gerçek bir kullanıcı deneyimi değildir ve puanlamayı etkilemez.";

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl p-5 max-w-md w-full max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <div className="text-xs text-gray-400 mb-1">{vehicleLabel}</div>
            <span
              className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full"
              style={{ background: muted ? "#E0E7FF" : "#6366F1", color: muted ? "#4F46E5" : "#fff" }}
            >
              🤖 {title}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 text-xl leading-none"
            aria-label="Kapat"
          >
            ✕
          </button>
        </div>
        <p className="text-sm text-gray-700 leading-relaxed">{summary.summaryText}</p>
        <p className="text-xs text-gray-400 leading-snug mt-3">{caption}</p>
      </div>
    </div>
  );
}

export function AiSummaryRow({ products }: { products: CompareProductView[] }) {
  const [openSlug, setOpenSlug] = useState<string | null>(null);
  const openProduct = products.find((p) => p.slug === openSlug) ?? null;

  return (
    <>
      <tr className="border-b border-gray-100">
        <th
          scope="row"
          className="sticky left-0 bg-gray-50 text-left font-semibold text-gray-500 text-xs uppercase tracking-wide px-3 py-2.5 align-top whitespace-nowrap"
        >
          AI Özeti
        </th>
        {products.map((p, i) => (
          <td key={p.slug} className={`${zebraColumnBg(i)} px-3 py-2.5 align-top`}>
            {p.aiSummary ? (
              <AiSummaryCell summary={p.aiSummary} onExpand={() => setOpenSlug(p.slug)} />
            ) : (
              <span className="text-xs text-gray-300">Henüz özet yok</span>
            )}
          </td>
        ))}
      </tr>

      {openProduct?.aiSummary && createPortal(
        <AiSummaryModal
          vehicleLabel={`${openProduct.brandName} ${openProduct.fullLabel}`}
          summary={openProduct.aiSummary}
          onClose={() => setOpenSlug(null)}
        />,
        document.body
      )}
    </>
  );
}
