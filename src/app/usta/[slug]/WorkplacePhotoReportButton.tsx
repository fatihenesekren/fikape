"use client";

import { useState } from "react";

// Çalışma yeri fotoğrafı için "bildir" — mevcut merkezi /api/report ucunu
// (targetType=EXPERT_WORKPLACE_PHOTO) kullanır, görünümü takas ilanı bildir
// deseniyle (ListingReportButton.tsx) aynı. Admin onayı tek seferliktir,
// yayın sonrası sahiplik itirazı/şikayet gelebilir diye (güven & güvenlik
// ajanı bulgusu) bu buton ayrıca gerekli. photoIndex/photoCount SADECE
// birden fazla fotoğraf varken "(2/3)" gibi gösterilir — kullanıcı hangi
// fotoğrafın bildirildiğinin belirsiz olduğunu fark etti.
export function WorkplacePhotoReportButton({
  photoId,
  photoIndex,
  photoCount,
}: {
  photoId: number;
  photoIndex?: number;
  photoCount?: number;
}) {
  const showIndex = photoIndex != null && photoCount != null && photoCount > 1;
  const indexLabel = showIndex ? ` (${photoIndex! + 1}/${photoCount})` : "";
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (note.trim().length < 5) {
      setError("Lütfen sorunu kısaca açıklayın.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetType: "EXPERT_WORKPLACE_PHOTO", workplacePhotoId: photoId, note: note.trim() }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Bildirim gönderilemedi.");
        return;
      }
      setDone(true);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      {done && !open ? (
        <p className="text-[11px] text-gray-400">Bildiriminiz alındı, teşekkürler.</p>
      ) : (
        <button
          type="button"
          onClick={() => { setError(null); setOpen(true); }}
          className="inline-flex items-center gap-1 text-[11px] font-medium text-gray-400 hover:text-gray-600 transition-colors"
        >
          <span aria-hidden="true">🚩</span> Bu fotoğrafı bildir{indexLabel}
        </button>
      )}

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 px-4 py-6"
          onClick={() => setOpen(false)}
        >
          <div className="bg-white rounded-2xl w-full max-w-md p-5 text-left" onClick={(e) => e.stopPropagation()}>
            {done ? (
              <div className="text-center py-4 space-y-2">
                <div className="text-2xl">✓</div>
                <p className="text-sm font-semibold text-gray-800">Bildiriminiz alındı, teşekkürler.</p>
                <button type="button" onClick={() => setOpen(false)} className="text-xs text-gray-400 hover:underline mt-2">Kapat</button>
              </div>
            ) : (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-gray-900">Bu fotoğrafı bildir{indexLabel}</h3>
                <p className="text-xs text-gray-500">
                  Fotoğrafın başka bir işletmeye ait olduğunu, yanıltıcı olduğunu ya da uygunsuz bir
                  içerik taşıdığını düşünüyorsanız kısaca açıklayın.
                </p>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={3}
                  maxLength={500}
                  placeholder="Örn: Bu fotoğraf başka bir işletmeye ait, benim dükkanım bu değil."
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none"
                />
                {error && <p className="text-xs text-red-600">{error}</p>}
                <div className="flex items-center gap-2 justify-end">
                  <button type="button" onClick={() => setOpen(false)} className="text-xs text-gray-400 hover:underline px-2">Vazgeç</button>
                  <button
                    type="button"
                    onClick={submit}
                    disabled={submitting}
                    className="px-4 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
                    style={{ background: "var(--btn-dark)" }}
                  >
                    {submitting ? "Gönderiliyor..." : "Bildir"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
