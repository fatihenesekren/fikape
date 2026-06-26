import { FikapeScore } from "@/components/FikapeScore";
import { calcOverall } from "@/lib/fikape";

const TRUST_BADGES: Record<number, { label: string; style: React.CSSProperties }> = {
  3: { label: "Doğrulanmış Sahip",     style: { background: "#EAF3DE", color: "#27500A" } },
  2: { label: "Beyan Edilen Sahip",    style: { background: "#E6F1FB", color: "#0C447C" } },
  1: { label: "E-posta Doğrulamalı",   style: { background: "#F1EFE8", color: "#444441" } },
};

interface Props {
  displayName: string | null;
  trustLevel: number;
  ownershipMonths: number | null;
  scoreFiyat: number;
  scoreKalite: number;
  scorePerformans: number;
  summaryText: string;
  detailText: string | null;
  wouldBuyAgain: boolean | null;
  createdAt: Date;
}

export function ReviewCard({
  displayName,
  trustLevel,
  ownershipMonths,
  scoreFiyat,
  scoreKalite,
  scorePerformans,
  summaryText,
  detailText,
  wouldBuyAgain,
  createdAt,
}: Props) {
  const scores = { scoreFiyat, scoreKalite, scorePerformans };
  const overall = calcOverall(scores);
  const badge = TRUST_BADGES[trustLevel];

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 space-y-4">
      {/* Üst satır: kullanıcı + tarih */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-sm font-bold text-gray-500 shrink-0">
            {displayName ? displayName[0].toUpperCase() : "?"}
          </div>
          <div>
            <div className="text-sm font-semibold text-gray-900">
              {displayName ?? "Anonim kullanıcı"}
            </div>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              {badge && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={badge.style}>
                  {badge.label}
                </span>
              )}
              {ownershipMonths != null && (
                <span className="text-[10px] text-gray-400">
                  {ownershipMonths} ay kullandı
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="text-right shrink-0">
          <div className="text-xl font-black text-gray-900">
            {overall.toFixed(1)}<span className="text-xs font-normal text-gray-400">/10</span>
          </div>
          <div className="text-[10px] text-gray-400 mt-0.5">
            {createdAt.toLocaleDateString("tr-TR", { month: "short", year: "numeric" })}
          </div>
        </div>
      </div>

      {/* FI·KA·PE chip'leri */}
      <FikapeScore scores={scores} variant="chips" />

      {/* Yorum metni */}
      <div>
        <p className="text-sm font-semibold text-gray-900 leading-snug">{summaryText}</p>
        {detailText && (
          <p className="text-sm text-gray-500 mt-2 leading-relaxed">{detailText}</p>
        )}
      </div>

      {/* Tekrar alır mı */}
      {wouldBuyAgain != null && (
        <div className="flex items-center gap-2 text-xs text-gray-500 pt-1 border-t border-gray-50">
          <span>{wouldBuyAgain ? "✓" : "✗"}</span>
          <span>{wouldBuyAgain ? "Tekrar alırım" : "Tekrar almam"}</span>
        </div>
      )}
    </div>
  );
}
