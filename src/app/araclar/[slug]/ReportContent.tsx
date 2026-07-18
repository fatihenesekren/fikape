"use client";

import { useState } from "react";
import Link from "next/link";
import { SPEC_FIELDS } from "@/lib/specFields";

type TargetType = "SPEC" | "PHOTO" | "REVIEW" | "QNA";

const TARGET_LABELS: Record<TargetType, string> = {
  SPEC: "Teknik Özellik",
  PHOTO: "Fotoğraf",
  REVIEW: "Yorum",
  QNA: "Soru-Cevap",
};

interface Props {
  productId: number;
  categorySlug: string;
  isLoggedIn: boolean;
  activeTab: "yorumlar" | "teknik" | "soru-cevap";
  reviewsForReport: { id: number; label: string }[];
  questionsForReport: { id: number; label: string }[];
  photosForReport: { id: number; label: string }[];
}

const TAB_TO_TARGET: Record<Props["activeTab"], TargetType> = {
  teknik: "SPEC",
  yorumlar: "REVIEW",
  "soru-cevap": "QNA",
};

export function ReportContent({
  productId, categorySlug, isLoggedIn, activeTab,
  reviewsForReport, questionsForReport, photosForReport,
}: Props) {
  const [open, setOpen] = useState(false);
  const [targetType, setTargetType] = useState<TargetType>(TAB_TO_TARGET[activeTab]);
  const [field, setField] = useState("");
  const [itemId, setItemId] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const specFields = SPEC_FIELDS[categorySlug] ?? [];

  function openModal() {
    setTargetType(TAB_TO_TARGET[activeTab]);
    setField("");
    setItemId("");
    setNote("");
    setDone(false);
    setError(null);
    setOpen(true);
  }

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
        body: JSON.stringify({
          productId,
          targetType,
          field: targetType === "SPEC" ? (field || null) : undefined,
          photoId: targetType === "PHOTO" ? (itemId || null) : undefined,
          reviewId: targetType === "REVIEW" ? (itemId || null) : undefined,
          questionId: targetType === "QNA" ? (itemId || null) : undefined,
          note,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Bildirim gönderilemedi, tekrar deneyin.");
        return;
      }
      setDone(true);
    } finally {
      setSubmitting(false);
    }
  }

  const itemOptions =
    targetType === "REVIEW" ? reviewsForReport :
    targetType === "QNA" ? questionsForReport :
    targetType === "PHOTO" ? photosForReport : [];

  return (
    <div className="mt-3 text-center">
      <button
        onClick={openModal}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-400 hover:text-gray-600 transition-colors"
      >
        <span aria-hidden="true">🚩</span> Bu sayfada bir hata mı gördünüz? Bildirin.
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 px-4 py-6" onClick={() => setOpen(false)}>
          <div
            className="bg-white rounded-2xl w-full max-w-md p-5 text-left"
            onClick={(e) => e.stopPropagation()}
          >
            {!isLoggedIn ? (
              <div className="text-center py-4 space-y-3">
                <p className="text-sm text-gray-600">Bildirim göndermek için giriş yapmalısınız.</p>
                <Link href="/giris" className="inline-block px-4 py-2 rounded-xl text-sm font-semibold text-white" style={{ background: "#111" }}>
                  Giriş Yap
                </Link>
              </div>
            ) : done ? (
              <div className="text-center py-4 space-y-2">
                <div className="text-2xl">✓</div>
                <p className="text-sm font-semibold text-gray-800">Bildiriminiz alındı, teşekkürler.</p>
                <button onClick={() => setOpen(false)} className="text-xs text-gray-400 hover:underline mt-2">Kapat</button>
              </div>
            ) : (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-gray-900">İçerik hatası bildir</h3>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">Ne ile ilgili?</label>
                  <select
                    value={targetType}
                    onChange={(e) => { setTargetType(e.target.value as TargetType); setField(""); setItemId(""); }}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                  >
                    {(Object.keys(TARGET_LABELS) as TargetType[]).map((t) => (
                      <option key={t} value={t}>{TARGET_LABELS[t]}</option>
                    ))}
                  </select>
                </div>

                {targetType === "SPEC" && specFields.length > 0 && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5">Hangi alan? (opsiyonel)</label>
                    <select
                      value={field}
                      onChange={(e) => setField(e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                    >
                      <option value="">Belirtmek istemiyorum</option>
                      {specFields.map((f) => (
                        <option key={f.key} value={f.key}>{f.label}</option>
                      ))}
                    </select>
                  </div>
                )}

                {targetType !== "SPEC" && itemOptions.length > 0 && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5">Hangisi? (opsiyonel)</label>
                    <select
                      value={itemId}
                      onChange={(e) => setItemId(e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                    >
                      <option value="">Belirtmek istemiyorum</option>
                      {itemOptions.map((o) => (
                        <option key={o.id} value={o.id}>{o.label}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">Sorunu açıklayın</label>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={3}
                    maxLength={500}
                    placeholder="Örn: Güç değeri yanlış, gerçekte 150 HP olmalı."
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none"
                  />
                </div>

                {error && <p className="text-xs text-red-600">{error}</p>}

                <div className="flex items-center gap-2 justify-end">
                  <button onClick={() => setOpen(false)} className="text-xs text-gray-400 hover:underline px-2">Vazgeç</button>
                  <button
                    onClick={submit}
                    disabled={submitting}
                    className="px-4 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
                    style={{ background: "#111" }}
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
