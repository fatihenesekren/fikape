"use client";

import { useEffect, useState } from "react";

export function InsuranceLeadCard({
  productId,
  vehicleName,
  defaultFullName,
  alreadySubmitted,
}: {
  productId: number;
  vehicleName: string;
  defaultFullName: string;
  alreadySubmitted: boolean;
}) {
  const storageKey = `leadDismissed:insurance:${productId}`;
  const [dismissed, setDismissed] = useState(true); // SSR/hydration'da önce gizli, sonra localStorage kontrolü
  const [fullName, setFullName] = useState(defaultFullName);
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(alreadySubmitted);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setDismissed(window.localStorage.getItem(storageKey) === "1");
  }, [storageKey]);

  if (done) {
    return (
      <div className="mt-3 text-xs font-medium text-green-700 bg-green-50 rounded-lg px-3 py-2">
        ✓ Sigorta teklifi talebini aldık, ilgili fırsatlar oluşunca seninle iletişime geçilecek.
      </div>
    );
  }

  if (dismissed) return null;

  function dismiss() {
    window.localStorage.setItem(storageKey, "1");
    setDismissed(true);
  }

  async function submit() {
    setError(null);
    if (fullName.trim().length < 2 || phone.trim().length < 10) {
      setError("Ad soyad ve geçerli bir telefon numarası giriniz.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/leads/insurance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, fullName, phone }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Bir hata oluştu.");
        return;
      }
      setDone(true);
    } catch {
      setError("Bir hata oluştu, tekrar dene.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mt-3 border border-amber-100 bg-amber-50/60 rounded-xl p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800">
          <span>🛡️</span>
          <span>Sigorta teklifi ister misin?</span>
          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">
            Reklam
          </span>
        </div>
        <button
          onClick={dismiss}
          className="text-amber-400 hover:text-amber-700 text-xs shrink-0"
          aria-label="Kapat"
        >
          ✕
        </button>
      </div>
      <p className="text-xs text-amber-700 mt-1">
        {vehicleName} için bilgini bırak, uygun sigorta teklifleri oluştuğunda seninle iletişime geçelim.
        Şu an aktif bir sigorta partnerimiz yok, bu sadece ilgi kaydı.
      </p>
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
      {error && <p className="text-xs text-red-600 mt-1.5">{error}</p>}
    </div>
  );
}
