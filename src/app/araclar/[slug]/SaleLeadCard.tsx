"use client";

import { useState } from "react";

type SaleLeadType = "EXPERTISE" | "QUICK_OFFER";

const TYPE_LABEL: Record<SaleLeadType, string> = {
  EXPERTISE: "Ekspertiz Randevusu",
  QUICK_OFFER: "Hızlı Nakit Teklif",
};

export function SaleLeadCard({
  productId,
  defaultFullName,
  submittedTypes,
}: {
  productId: number;
  defaultFullName: string;
  submittedTypes: SaleLeadType[];
}) {
  const [dismissed, setDismissed] = useState(false);
  const [doneTypes, setDoneTypes] = useState<SaleLeadType[]>(submittedTypes);
  const [selectedType, setSelectedType] = useState<SaleLeadType | null>(null);
  const [fullName, setFullName] = useState(defaultFullName);
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const remainingTypes = (["EXPERTISE", "QUICK_OFFER"] as SaleLeadType[]).filter(
    (t) => !doneTypes.includes(t)
  );

  if (dismissed || remainingTypes.length === 0) return null;

  async function submit() {
    if (!selectedType) {
      setError("Bir seçenek seç.");
      return;
    }
    if (fullName.trim().length < 2 || phone.trim().length < 10) {
      setError("Ad soyad ve geçerli bir telefon numarası gir.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/leads/sale", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, type: selectedType, fullName, phone }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Bir hata oluştu.");
        return;
      }
      setDoneTypes((prev) => [...prev, selectedType]);
      setSelectedType(null);
    } catch {
      setError("Bir hata oluştu, tekrar dene.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="border border-amber-100 bg-amber-50/60 rounded-xl p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800">
          <span>🔧</span>
          <span>Satmadan önce yardımcı olalım mı?</span>
          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">
            Reklam
          </span>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-amber-400 hover:text-amber-700 text-xs shrink-0"
          aria-label="Kapat"
        >
          ✕
        </button>
      </div>
      <p className="text-xs text-amber-700 mt-1">
        İlgilenirsen bilgini bırak, uygun fırsatlar oluşunca seninle iletişime geçelim.
        Şu an aktif bir partnerimiz yok, bu sadece ilgi kaydı.
      </p>

      <div className="flex flex-wrap gap-2 mt-2.5">
        {remainingTypes.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setSelectedType(t)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold border-2 transition-all"
            style={
              selectedType === t
                ? { background: "#92400e", borderColor: "#92400e", color: "#fff" }
                : { background: "#fff", borderColor: "#fde68a", color: "#92400e" }
            }
          >
            {TYPE_LABEL[t]}
          </button>
        ))}
      </div>

      {selectedType && (
        <div className="mt-2.5 flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Ad Soyad"
            className="flex-1 text-sm rounded-lg border border-amber-200 px-2.5 py-1.5 bg-white"
          />
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Telefon"
            className="flex-1 text-sm rounded-lg border border-amber-200 px-2.5 py-1.5 bg-white"
          />
          <button
            onClick={submit}
            disabled={submitting}
            className="text-sm font-semibold px-3 py-1.5 rounded-lg text-white shrink-0 disabled:opacity-60"
            style={{ background: "#92400e" }}
          >
            {submitting ? "Gönderiliyor..." : "Bilgimi Bırak"}
          </button>
        </div>
      )}
      {error && <p className="text-xs text-red-600 mt-1.5">{error}</p>}
    </div>
  );
}
