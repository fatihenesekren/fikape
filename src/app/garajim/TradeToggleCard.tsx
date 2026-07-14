"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TURKISH_CITIES } from "@/lib/turkishCities";

type PaymentIntent = "SWAP_ONLY" | "PAYS_EXTRA" | "WANTS_EXTRA";
type CloseReason = "TRADED" | "GAVE_UP" | "FOUND_ELSEWHERE";

export function TradeToggleCard({
  userProductId,
  trustLevelOk,
  categories,
  brands,
  existingListing,
}: {
  userProductId: number;
  trustLevelOk: boolean;
  categories: { id: number; name: string }[];
  brands: { id: number; name: string }[];
  existingListing: { id: number } | null;
}) {
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(false);
  const [city, setCity] = useState("");
  const [wantAnything, setWantAnything] = useState(true);
  const [wantCategoryId, setWantCategoryId] = useState("");
  const [wantBrandId, setWantBrandId] = useState("");
  const [paymentIntent, setPaymentIntent] = useState<PaymentIntent>("SWAP_ONLY");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [closeReason, setCloseReason] = useState<CloseReason | "">("");
  const [closing, setClosing] = useState(false);

  if (!trustLevelOk) {
    return (
      <p className="mt-3 text-xs text-gray-400 bg-gray-50 rounded-lg px-3 py-2">
        Takasa açmak için garajınızda fotoğraflı, onaylanmış bir yorumunuz olması gerekiyor.
      </p>
    );
  }

  if (existingListing) {
    async function closeListing() {
      setClosing(true);
      try {
        const res = await fetch(`/api/trades/${existingListing!.id}/close`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ closeReason: closeReason || null }),
        });
        if (res.ok) router.refresh();
      } finally {
        setClosing(false);
      }
    }

    return (
      <div className="mt-3 border border-indigo-100 bg-indigo-50/60 rounded-xl p-3">
        <p className="text-xs font-bold text-indigo-800">✓ Takasa açık</p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <select
            value={closeReason}
            onChange={(e) => setCloseReason(e.target.value as CloseReason | "")}
            className="text-xs rounded-lg border border-indigo-200 px-2 py-1 bg-white"
          >
            <option value="">Kapatma sebebi (opsiyonel)</option>
            <option value="TRADED">Takas oldu</option>
            <option value="GAVE_UP">Vazgeçtim</option>
            <option value="FOUND_ELSEWHERE">Başka yerden buldum</option>
          </select>
          <button
            onClick={closeListing}
            disabled={closing}
            className="text-xs font-semibold text-indigo-700 hover:underline disabled:opacity-60"
          >
            İlanı Kapat
          </button>
        </div>
      </div>
    );
  }

  if (!formOpen) {
    return (
      <button
        onClick={() => setFormOpen(true)}
        className="mt-3 text-xs font-semibold px-3 py-1.5 rounded-lg text-white"
        style={{ background: "#4338ca" }}
      >
        🔄 Takasa Aç
      </button>
    );
  }

  async function submit() {
    setError(null);
    if (!city) {
      setError("Lütfen ilinizi seçiniz.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/trades", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userProductId,
          city,
          wantAnything,
          wantCategoryId: wantAnything ? null : wantCategoryId || null,
          wantBrandId: wantAnything ? null : wantBrandId || null,
          paymentIntent,
          note: note.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Bir hata oluştu.");
        return;
      }
      router.refresh();
    } catch {
      setError("Bir hata oluştu, tekrar dene.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mt-3 border border-indigo-100 bg-indigo-50/60 rounded-xl p-3 space-y-2.5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold text-indigo-800">Takasa Aç</p>
        <button onClick={() => setFormOpen(false)} className="text-indigo-400 hover:text-indigo-700 text-xs">✕</button>
      </div>

      <select
        value={city}
        onChange={(e) => setCity(e.target.value)}
        className="w-full text-sm rounded-lg border border-indigo-200 px-2.5 py-1.5 bg-white"
      >
        <option value="">İl seçiniz</option>
        {TURKISH_CITIES.map((c) => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>

      <label className="flex items-center gap-2 text-xs text-indigo-800">
        <input type="checkbox" checked={wantAnything} onChange={(e) => setWantAnything(e.target.checked)} />
        Marka/kategori fark etmez
      </label>

      {!wantAnything && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <select
            value={wantCategoryId}
            onChange={(e) => setWantCategoryId(e.target.value)}
            className="text-sm rounded-lg border border-indigo-200 px-2.5 py-1.5 bg-white"
          >
            <option value="">Kategori seçiniz</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <select
            value={wantBrandId}
            onChange={(e) => setWantBrandId(e.target.value)}
            className="text-sm rounded-lg border border-indigo-200 px-2.5 py-1.5 bg-white"
          >
            <option value="">Marka seçiniz</option>
            {brands.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>
      )}

      <fieldset className="text-xs text-indigo-800">
        <legend className="font-semibold mb-1">Ödeme niyeti</legend>
        <div className="flex flex-col gap-1">
          <label className="flex items-center gap-1.5">
            <input type="radio" name="paymentIntent" checked={paymentIntent === "SWAP_ONLY"} onChange={() => setPaymentIntent("SWAP_ONLY")} />
            Sadece takas
          </label>
          <label className="flex items-center gap-1.5">
            <input type="radio" name="paymentIntent" checked={paymentIntent === "PAYS_EXTRA"} onChange={() => setPaymentIntent("PAYS_EXTRA")} />
            Üstüne para verebilirim
          </label>
          <label className="flex items-center gap-1.5">
            <input type="radio" name="paymentIntent" checked={paymentIntent === "WANTS_EXTRA"} onChange={() => setPaymentIntent("WANTS_EXTRA")} />
            Üstüne para bekliyorum
          </label>
        </div>
      </fieldset>

      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Opsiyonel not"
        maxLength={300}
        rows={2}
        className="w-full text-sm rounded-lg border border-indigo-200 px-2.5 py-1.5 bg-white"
      />

      <p className="text-[11px] text-indigo-700 bg-indigo-100/60 rounded-lg px-2.5 py-2">
        Fark tutarını asla aracınızı teslim etmeden önce göndermeyiniz. Buluşmayı halka açık, kalabalık bir yerde yapınız.
      </p>

      <button
        onClick={submit}
        disabled={submitting}
        className="w-full text-sm font-semibold px-3 py-1.5 rounded-lg text-white disabled:opacity-60"
        style={{ background: "#4338ca" }}
      >
        {submitting ? "Gönderiliyor..." : "Takasa Aç"}
      </button>

      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
