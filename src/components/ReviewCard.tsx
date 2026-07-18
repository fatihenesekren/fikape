import Link from "next/link";
import { Avatar } from "@/components/Avatar";
import { FikapeScore } from "@/components/FikapeScore";
import { ReviewHelpfulButtons } from "@/components/ReviewHelpfulButtons";
import { DeleteReviewButton } from "@/components/DeleteReviewButton";
import { calcOverall } from "@/lib/fikape";
import { CHIP_LABEL } from "@/lib/chips";
import { TRUST_BADGES } from "@/lib/trustBadge";
import { SOLD_REASON_LABEL } from "@/lib/soldReasons";

interface ScoreVersion {
  version: number;
  scoreOverall: number | null;
  createdAt: Date;
}

interface Props {
  displayName: string | null;
  avatarUrl?: string | null;
  avatarSeed?: string;
  trustLevel: number;
  ownershipMonths: number | null;
  scoreFiyat: number;
  scoreKalite: number;
  scorePerformans: number;
  summaryText: string;
  detailText: string | null;
  wouldBuyAgain: boolean | null;
  createdAt: Date;
  editedAt?: Date | null;
  editCount?: number | null;
  versions?: ScoreVersion[];
  ownershipStatus?: string | null;
  soldReason?: string | null;
  extendedData?: Record<string, unknown> | null;
  isFounding?: boolean;
  reviewId?: number;
  helpfulCount?: number;
  currentUserVote?: boolean | null;
  isLoggedIn?: boolean;
  isOwnReview?: boolean;
}

export function ReviewCard({
  displayName,
  avatarUrl,
  avatarSeed,
  trustLevel,
  ownershipMonths,
  scoreFiyat,
  scoreKalite,
  scorePerformans,
  summaryText,
  detailText,
  wouldBuyAgain,
  createdAt,
  editedAt,
  editCount,
  versions,
  ownershipStatus,
  soldReason,
  extendedData,
  isFounding,
  reviewId,
  helpfulCount = 0,
  currentUserVote = null,
  isLoggedIn = false,
  isOwnReview = false,
}: Props) {
  const scores = { scoreFiyat, scoreKalite, scorePerformans };
  const overall = calcOverall(scores);
  const badge = TRUST_BADGES[trustLevel] ?? null;

  const pros = (extendedData?.pros as string[] | undefined) ?? [];
  const cons = (extendedData?.cons as string[] | undefined) ?? [];
  const hasChips = pros.length > 0 || cons.length > 0;

  // Skor trend: en az 2 versiyonu olan, scoreOverall dolu versiyonlar
  const scoredVersions = (versions ?? []).filter((v) => v.scoreOverall != null);
  const showTrend = scoredVersions.length >= 2;

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 space-y-4">
      {/* Üst satır: kullanıcı + tarih */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <Avatar
            displayName={displayName}
            avatarUrl={avatarUrl}
            seed={avatarSeed ?? displayName ?? "?"}
            size={36}
          />
          <div>
            <div className="text-sm font-semibold text-gray-900">
              {displayName ?? "Anonim kullanıcı"}
            </div>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              {badge && (
                <span
                  className="text-[10px] font-semibold px-2 py-0.5 rounded-full inline-flex items-center gap-1"
                  style={{ background: badge.bg, color: badge.color }}
                >
                  {badge.icon && <span>{badge.icon}</span>}
                  {badge.label}
                </span>
              )}
              {isFounding && (
                <span
                  className="text-[10px] font-semibold px-2 py-0.5 rounded-full inline-flex items-center gap-1"
                  style={{ background: "#FEF3C7", color: "#92400E" }}
                  title="Bu araç için ilk 3 yorumcudan biri"
                >
                  <span>🏅</span>
                  Kurucu Yorumcu
                </span>
              )}
              {ownershipStatus === "PAST" && (
                <span
                  className="text-[10px] font-semibold px-2 py-0.5 rounded-full inline-flex items-center gap-1"
                  style={{ background: "#f3f4f6", color: "#6b7280" }}
                >
                  {soldReason ? `Satıldı · ${SOLD_REASON_LABEL[soldReason] ?? soldReason}` : "Eski Kullanıcı"}
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
            {editedAt
              ? `v${editCount ?? 1} · ${editedAt.toLocaleDateString("tr-TR", { month: "short", year: "numeric" })}`
              : createdAt.toLocaleDateString("tr-TR", { month: "short", year: "numeric" })}
          </div>
        </div>
      </div>

      {/* Skor geçmişi trendi */}
      {showTrend && (
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] text-gray-400 font-medium">Skor geçmişi:</span>
          {scoredVersions.map((v, i) => {
            const isLast = i === scoredVersions.length - 1;
            const prev = i > 0 ? scoredVersions[i - 1].scoreOverall! : null;
            const cur = v.scoreOverall!;
            const delta = prev != null ? cur - prev : 0;
            const color = prev == null ? "#6b7280" : delta > 0 ? "#16a34a" : delta < 0 ? "#dc2626" : "#6b7280";
            return (
              <span key={v.version} className="flex items-center gap-1">
                {i > 0 && <span className="text-gray-300 text-[10px]">→</span>}
                <span
                  className="text-[11px] font-bold tabular-nums"
                  style={{ color: isLast ? "#111" : color }}
                  title={v.createdAt instanceof Date
                    ? v.createdAt.toLocaleDateString("tr-TR", { month: "short", year: "numeric" })
                    : ""}
                >
                  {cur.toFixed(1)}
                </span>
              </span>
            );
          })}
        </div>
      )}

      {/* FI·KA·PE chip'leri */}
      <FikapeScore scores={scores} variant="chips" />

      {/* Artılar & Eksiler */}
      {hasChips && (
        <div className="space-y-2">
          {pros.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {pros.map((key) => (
                <span
                  key={key}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold"
                  style={{ background: "#dcfce7", color: "#16a34a" }}
                >
                  <span>+</span>
                  {CHIP_LABEL[key] ?? key}
                </span>
              ))}
            </div>
          )}
          {cons.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {cons.map((key) => (
                <span
                  key={key}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold"
                  style={{ background: "#fee2e2", color: "#dc2626" }}
                >
                  <span>−</span>
                  {CHIP_LABEL[key] ?? key}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Yorum metni */}
      {(summaryText || detailText) && (
        <div>
          {summaryText && (
            <p className="text-sm font-semibold text-gray-900 leading-snug">{summaryText}</p>
          )}
          {detailText && (
            <p className={`text-sm text-gray-500 leading-relaxed ${summaryText ? "mt-2" : ""}`}>
              {detailText}
            </p>
          )}
        </div>
      )}

      {/* Tekrar alır mı */}
      {wouldBuyAgain != null && (
        <div className="flex items-center gap-2 text-xs text-gray-500 pt-1 border-t border-gray-50">
          <span>{wouldBuyAgain ? "✓" : "✗"}</span>
          <span>{wouldBuyAgain ? "Tekrar alırım" : "Tekrar almam"}</span>
        </div>
      )}

      {/* Faydalı oyu — kendi yorumunda gösterilmez */}
      {reviewId != null && !isOwnReview && (
        <div className="pt-1 border-t border-gray-50">
          <ReviewHelpfulButtons
            reviewId={reviewId}
            initialHelpfulCount={helpfulCount}
            initialUserVote={currentUserVote}
            isLoggedIn={isLoggedIn}
          />
        </div>
      )}

      {/* Kendi yorumun — düzenle/sil */}
      {isOwnReview && reviewId != null && (
        <div className="pt-2 border-t border-gray-50 flex items-center gap-4">
          <Link
            href={`/yorumum/${reviewId}/duzenle`}
            className="text-xs font-semibold text-gray-400 hover:text-gray-700 transition-colors"
          >
            ✎ Düzenle
          </Link>
          <DeleteReviewButton reviewId={reviewId} />
        </div>
      )}
    </div>
  );
}
