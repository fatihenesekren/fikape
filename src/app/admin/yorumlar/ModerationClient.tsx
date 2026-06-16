"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FIKAPE } from "@/lib/fikape";

interface Review {
  id: number;
  summaryText: string;
  detailText: string | null;
  scoreFiyat: number;
  scoreKalite: number;
  scorePerformans: number;
  scoreOverall: number;
  wouldBuyAgain: boolean | null;
  ownershipMonthsAtReview: number | null;
  createdAt: string;
  user: { email: string; displayName: string | null };
  product: { name: string; slug: string; model: { name: string; brand: { name: string } } };
}

function ScorePill({ label, value, color, bg }: { label: string; value: number; color: string; bg: string }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold" style={{ background: bg, color }}>
      {label} {value.toFixed(1)}
    </span>
  );
}

function ReviewRow({ review, onDone }: { review: Review; onDone: () => void }) {
  const [loading, setLoading] = useState<"approve" | "reject" | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [showReject, setShowReject] = useState(false);

  async function handle(action: "approve" | "reject") {
    setLoading(action);
    await fetch(`/api/admin/reviews/${review.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, reason: rejectReason || undefined }),
    });
    setLoading(null);
    onDone();
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
      {/* Üst satır: araç + kullanıcı + tarih */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold">
            {review.product.model.brand.name} {review.product.model.name} · {review.product.name}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            {review.user.displayName ?? review.user.email} ·{" "}
            {new Date(review.createdAt).toLocaleDateString("tr-TR")}
          </p>
        </div>
        <div className="text-right shrink-0">
          <span className="text-2xl font-black text-gray-900">{review.scoreOverall.toFixed(1)}</span>
          <span className="text-xs text-gray-400">/10</span>
        </div>
      </div>

      {/* Puanlar */}
      <div className="flex flex-wrap gap-1.5">
        {FIKAPE.map(({ short, label, color, bg, key }) => (
          <ScorePill
            key={key}
            label={short}
            color={color}
            bg={bg}
            value={review[key as keyof Review] as number}
          />
        ))}
        {review.wouldBuyAgain !== null && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-gray-600">
            {review.wouldBuyAgain ? "👍 Tavsiye eder" : "👎 Tavsiye etmez"}
          </span>
        )}
      </div>

      {/* Özet */}
      <p className="text-sm font-semibold text-gray-800">{review.summaryText}</p>

      {/* Detay */}
      {review.detailText && (
        <p className="text-sm text-gray-600 leading-relaxed">{review.detailText}</p>
      )}

      {/* Reddetme sebebi alanı */}
      {showReject && (
        <div className="space-y-2">
          <input
            type="text"
            placeholder="Red sebebi (opsiyonel)"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gray-400"
          />
        </div>
      )}

      {/* Aksiyon butonları */}
      <div className="flex gap-2 pt-1">
        <button
          onClick={() => handle("approve")}
          disabled={!!loading}
          className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-colors disabled:opacity-50"
          style={{ background: "#16a34a" }}
        >
          {loading === "approve" ? "..." : "✓ Onayla"}
        </button>

        {!showReject ? (
          <button
            onClick={() => setShowReject(true)}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold border-2 border-red-200 text-red-500 transition-colors hover:bg-red-50"
          >
            ✕ Reddet
          </button>
        ) : (
          <button
            onClick={() => handle("reject")}
            disabled={!!loading}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-colors disabled:opacity-50"
            style={{ background: "#dc2626" }}
          >
            {loading === "reject" ? "..." : "✕ Reddet"}
          </button>
        )}
      </div>
    </div>
  );
}

export function ModerationClient({ initialReviews }: { initialReviews: Review[] }) {
  const router = useRouter();
  const [reviews, setReviews] = useState(initialReviews);

  function removeReview(id: number) {
    setReviews((prev) => prev.filter((r) => r.id !== id));
    router.refresh();
  }

  if (reviews.length === 0) {
    return (
      <div className="text-center py-20 text-gray-400">
        <div className="text-4xl mb-3">✓</div>
        <p className="font-semibold">Bekleyen yorum yok</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {reviews.map((r) => (
        <ReviewRow key={r.id} review={r} onDone={() => removeReview(r.id)} />
      ))}
    </div>
  );
}
