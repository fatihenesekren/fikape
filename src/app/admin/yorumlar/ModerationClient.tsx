"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FIKAPE } from "@/lib/fikape";
import { CHIP_LABEL } from "@/lib/chips";
import { BlurEditor } from "./BlurEditor";

interface Photo { id: number; url: string; }

interface Review {
  id: number;
  summaryText: string;
  detailText: string | null;
  extendedData: unknown;
  scoreFiyat: number;
  scoreKalite: number;
  scorePerformans: number;
  scoreOverall: number;
  wouldBuyAgain: boolean | null;
  ownershipMonthsAtReview: number | null;
  createdAt: string;
  user: { email: string; displayName: string | null };
  product: { name: string; slug: string; model: { name: string; brand: { name: string } } };
  photos: Photo[];
  sameIpCount: number;
  sameChipComboCount: number;
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
  const [photos, setPhotos] = useState<Photo[]>(review.photos);
  const [editingPhoto, setEditingPhoto] = useState<Photo | null>(null);

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

  function handlePhotoSaved(photoId: number, newUrl: string) {
    setPhotos((prev) => prev.map((p) => p.id === photoId ? { ...p, url: newUrl } : p));
    setEditingPhoto(null);
  }

  return (
    <>
      {editingPhoto && (
        <BlurEditor
          photoId={editingPhoto.id}
          url={editingPhoto.url}
          onSave={(newUrl) => handlePhotoSaved(editingPhoto.id, newUrl)}
          onClose={() => setEditingPhoto(null)}
        />
      )}

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
            {review.sameIpCount > 1 && (
              <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                ⚠ Bu IP&apos;den {review.sameIpCount} yorum
              </span>
            )}
            {review.sameChipComboCount > 1 && (
              <span className="inline-flex items-center gap-1 mt-1 ml-1 px-2 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                ⚠ Aynı artı/eksi seti {review.sameChipComboCount} kez
              </span>
            )}
          </div>
          <div className="text-right shrink-0">
            <span className="text-2xl font-black text-gray-900">{review.scoreOverall.toFixed(1)}</span>
            <span className="text-xs text-gray-400">/10</span>
          </div>
        </div>

        {/* Puanlar */}
        <div className="flex flex-wrap gap-1.5">
          {FIKAPE.map(({ short, color, bg, key }) => (
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
        {review.summaryText && (
          <p className="text-sm font-semibold text-gray-800">{review.summaryText}</p>
        )}

        {/* Pro/Con chip'ler */}
        {(() => {
          const ext = review.extendedData as Record<string, unknown> | null | undefined;
          const pros = ext?.pros as string[] | undefined;
          const cons = ext?.cons as string[] | undefined;
          if (!pros?.length && !cons?.length) return null;
          return (
            <div className="flex flex-wrap gap-1.5">
              {(pros ?? []).map((k) => (
                <span key={k} className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200">
                  + {CHIP_LABEL[k] ?? k}
                </span>
              ))}
              {(cons ?? []).map((k) => (
                <span key={k} className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
                  − {CHIP_LABEL[k] ?? k}
                </span>
              ))}
            </div>
          );
        })()}

        {/* Detay */}
        {review.detailText && (
          <p className="text-sm text-gray-600 leading-relaxed">{review.detailText}</p>
        )}

        {/* Fotoğraflar */}
        {photos.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide">Fotoğraflar</p>
            <div className="flex gap-2 flex-wrap">
              {photos.map((p, idx) => (
                <div key={p.id} className="relative group w-24 h-24 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.url} alt={`Fotoğraf ${idx + 1}`} className="w-full h-full object-cover" />
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                    <button
                      type="button"
                      onClick={() => setEditingPhoto(p)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity bg-white rounded-lg px-2 py-1 text-xs font-bold text-gray-800 shadow"
                    >
                      Bulanıklaştır
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
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
    </>
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
