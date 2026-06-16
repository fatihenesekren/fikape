"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { calcOverall, FIKAPE } from "@/lib/fikape";

interface Product {
  slug: string;
  name: string;
  brandName: string;
  modelName: string;
  trimName: string | null;
  year: number | null;
}

interface Props {
  products: Product[];
  defaultSlug?: string;
}

function ScoreSelector({
  label, short, color, bg, value, onChange,
}: {
  label: string; short: string; color: string; bg: string;
  value: number; onChange: (v: number) => void;
}) {
  const LABELS = ["", "Çok Kötü", "Kötü", "Orta", "İyi", "Mükemmel"];
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: bg, color }}>
            {short}
          </span>
          <span className="text-sm font-semibold text-gray-700">{label}</span>
        </div>
        {value > 0 && (
          <span className="text-xs font-medium px-2 py-0.5 rounded-full"
            style={{ background: bg, color }}>
            {LABELS[value]}
          </span>
        )}
      </div>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className="flex-1 h-10 rounded-xl text-sm font-bold border-2 transition-all"
            style={
              value === n
                ? { background: color, borderColor: color, color: "#fff" }
                : value > 0 && n < value
                ? { background: bg, borderColor: "transparent", color }
                : { background: "#f9fafb", borderColor: "#e5e7eb", color: "#9ca3af" }
            }
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}

export function ReviewForm({ products, defaultSlug }: Props) {
  const router = useRouter();

  const [productSlug,    setProductSlug]    = useState(defaultSlug ?? "");
  const [scoreFiyat,     setScoreFiyat]     = useState(0);
  const [scoreKalite,    setScoreKalite]    = useState(0);
  const [scorePerformans,setScorePerformans]= useState(0);
  const [summaryText,    setSummaryText]    = useState("");
  const [detailText,     setDetailText]     = useState("");
  const [wouldBuyAgain,  setWouldBuyAgain]  = useState<boolean | null>(null);
  const [ownershipMonths,setOwnershipMonths]= useState("");
  const [error,          setError]          = useState("");
  const [loading,        setLoading]        = useState(false);

  const scoresComplete = scoreFiyat > 0 && scoreKalite > 0 && scorePerformans > 0;
  const overall = scoresComplete
    ? calcOverall({ scoreFiyat, scoreKalite, scorePerformans })
    : null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!productSlug) { setError("Lütfen bir araç seçin."); return; }
    if (!scoresComplete) { setError("Lütfen tüm FI·KA·PE puanlarını verin."); return; }
    if (!summaryText.trim()) { setError("Lütfen kısa bir özet yazın."); return; }

    setLoading(true);
    const res = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productSlug, scoreFiyat, scoreKalite, scorePerformans,
        summaryText, detailText, wouldBuyAgain,
        ownershipMonths: ownershipMonths || null,
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) { setError(data.error ?? "Bir hata oluştu."); return; }

    router.push(`/araclar/${productSlug}?yorum=gonderildi`);
  }

  const selectedProduct = products.find((p) => p.slug === productSlug);

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto px-4 py-10 space-y-8">

      <div>
        <h1 className="text-2xl font-black text-gray-900">Yorum yaz</h1>
        <p className="text-sm text-gray-500 mt-1">
          Deneyimini paylaş, diğer kullanıcılara yol göster.
        </p>
      </div>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
          {error}
        </div>
      )}

      {/* Araç seçimi */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
        <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Araç</h2>
        <select
          value={productSlug}
          onChange={(e) => setProductSlug(e.target.value)}
          className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gray-400 bg-white"
        >
          <option value="">— Araç seçin —</option>
          {products.map((p) => (
            <option key={p.slug} value={p.slug}>
              {p.brandName} {p.modelName}
              {p.trimName ? ` · ${p.trimName}` : ""}
              {p.year ? ` (${p.year})` : ""}
            </option>
          ))}
        </select>
        {selectedProduct && (
          <p className="text-xs text-gray-400">
            {selectedProduct.brandName} {selectedProduct.modelName}
            {selectedProduct.trimName && ` · ${selectedProduct.trimName}`}
            {selectedProduct.year && ` · ${selectedProduct.year}`}
          </p>
        )}
      </div>

      {/* FI·KA·PE Puanlama */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide">
            fi·ka·pe Puanı
          </h2>
          {overall !== null && (
            <div className="text-right">
              <span className="text-2xl font-black text-gray-900">{overall.toFixed(1)}</span>
              <span className="text-xs text-gray-400 ml-1">/ 5</span>
            </div>
          )}
        </div>

        {FIKAPE.map(({ key, short, label, color, bg }) => (
          <ScoreSelector
            key={key}
            short={short}
            label={label}
            color={color}
            bg={bg}
            value={
              key === "scoreFiyat" ? scoreFiyat :
              key === "scoreKalite" ? scoreKalite : scorePerformans
            }
            onChange={
              key === "scoreFiyat" ? setScoreFiyat :
              key === "scoreKalite" ? setScoreKalite : setScorePerformans
            }
          />
        ))}
      </div>

      {/* Özet */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Kısa Özet</h2>
          <span className="text-xs text-gray-400">{summaryText.length}/500</span>
        </div>
        <textarea
          value={summaryText}
          onChange={(e) => setSummaryText(e.target.value.slice(0, 500))}
          rows={3}
          required
          placeholder="Bu aracı tek cümleyle özetleyin..."
          className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gray-400 resize-none"
        />
      </div>

      {/* Detay */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
        <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide">
          Detaylı Yorum <span className="text-gray-400 font-normal normal-case">(opsiyonel)</span>
        </h2>
        <textarea
          value={detailText}
          onChange={(e) => setDetailText(e.target.value)}
          rows={5}
          placeholder="Araçla ilgili detaylı deneyimlerinizi paylaşın..."
          className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gray-400 resize-none"
        />
      </div>

      {/* Ek bilgiler */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-5">
        <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Ek Bilgiler</h2>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-gray-500">Tekrar alır mıydınız?</label>
          <div className="flex gap-2">
            {([
              { value: true,  label: "Evet, kesinlikle" },
              { value: false, label: "Hayır" },
              { value: null,  label: "Emin değilim" },
            ] as const).map((opt) => (
              <button
                key={String(opt.value)}
                type="button"
                onClick={() => setWouldBuyAgain(opt.value)}
                className="flex-1 py-2 rounded-xl text-xs font-semibold border-2 transition-all"
                style={
                  wouldBuyAgain === opt.value
                    ? { background: "#111", borderColor: "#111", color: "#fff" }
                    : { background: "#f9fafb", borderColor: "#e5e7eb", color: "#6b7280" }
                }
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-gray-500">
            Bu aracı kaç aydır kullanıyorsunuz?
          </label>
          <input
            type="number"
            min={1}
            max={240}
            value={ownershipMonths}
            onChange={(e) => setOwnershipMonths(e.target.value)}
            placeholder="Örn: 18"
            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gray-400"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3.5 rounded-xl text-sm font-bold text-white transition-colors disabled:opacity-60"
        style={{ background: "#111" }}
      >
        {loading ? "Gönderiliyor..." : "Yorumu Gönder →"}
      </button>

      <p className="text-xs text-center text-gray-400">
        Yorumunuz moderasyon onayından sonra yayınlanacaktır.
      </p>

    </form>
  );
}
