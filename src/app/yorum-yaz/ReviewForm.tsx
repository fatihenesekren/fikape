"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { calcOverall, FIKAPE, SCORE_LABELS } from "@/lib/fikape";
import { validateSummary, validateDetail } from "@/lib/reviewValidation";

const FUEL_LABELS: Record<string, string> = {
  EV: "⚡ Elektrik", HYBRID: "🔋 Hibrit",
  GASOLINE: "⛽ Benzin", DIESEL: "🛢 Dizel", LPG: "🔵 LPG",
};

const BODY_LABELS: Record<string, string> = {
  suv: "SUV", sedan: "Sedan", hatchback: "Hatchback",
  mpv: "MPV", pickup: "Pick-up", coupe: "Coupe",
};

interface Product {
  slug: string;
  name: string;
  brandName: string;
  modelName: string;
  trimName: string | null;
  year: number | null;
  imageUrl: string | null;
  fuelType: string | null;
  bodyType: string | null;
}

interface Props {
  products: Product[];
  defaultSlug?: string;
}

const OWNERSHIP_SLOTS = [
  { key: "new",    label: "Yeni aldım",  months: 2  },
  { key: "mid",    label: "3–12 ay",     months: 6  },
  { key: "one3",   label: "1–3 yıl",     months: 24 },
  { key: "three5", label: "3–5 yıl",     months: 48 },
  { key: "five",   label: "5 yıl+",      months: 72 },
];
const OWNERSHIP_MONTHS: Record<string, number> = Object.fromEntries(
  OWNERSHIP_SLOTS.map((s) => [s.key, s.months])
);

const RECOMMEND_OPTS = [
  { value: "yes",   icon: "👍", label: "Evet, kesinlikle" },
  { value: "maybe", icon: "🤷", label: "Kararsızım"       },
  { value: "no",    icon: "👎", label: "Hayır"            },
] as const;

const USAGE_OPTS = [
  { value: "city",    icon: "🏙️", label: "Şehir içi"      },
  { value: "highway", icon: "🛣️", label: "Şehirlerarası"  },
  { value: "mixed",   icon: "🔀", label: "Karma"           },
] as const;

function FieldFeedback({ error, ok }: { error: string | null; ok: boolean }) {
  if (!error && !ok) return null;
  if (ok) return (
    <p className="text-xs text-green-600 flex items-center gap-1">
      <span>✓</span> Görünüyor güzel!
    </p>
  );
  return (
    <p className="text-xs text-red-500 flex items-center gap-1">
      <span>⚠</span> {error}
    </p>
  );
}

function ScoreSelector({
  label, short, color, bg, value, onChange,
}: {
  label: string; short: string; color: string; bg: string;
  value: number; onChange: (v: number) => void;
}) {
  const [hovered, setHovered] = useState(0);
  const active = hovered || value;

  return (
    <div className="space-y-3">
      {/* Başlık + büyük skor */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black"
            style={{ background: bg, color }}
          >
            {short}
          </span>
          <span className="text-sm font-semibold text-gray-700">{label}</span>
        </div>

        <div className="flex items-baseline gap-1.5 min-w-[90px] justify-end">
          {active > 0 ? (
            <>
              <span className="text-3xl font-black leading-none" style={{ color }}>
                {active}
              </span>
              <span className="text-xs font-medium" style={{ color }}>
                {SCORE_LABELS[active]}
              </span>
            </>
          ) : (
            <span className="text-xs text-gray-300">Puan ver</span>
          )}
        </div>
      </div>

      {/* Segment track */}
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            onMouseEnter={() => setHovered(n)}
            onMouseLeave={() => setHovered(0)}
            className="flex-1 flex flex-col items-center gap-1 group"
          >
            <div
              className="w-full h-7 rounded-md transition-all duration-100"
              style={
                n <= active
                  ? { background: color, opacity: 0.6 + (n / active) * 0.4 }
                  : { background: "#f0f0f0" }
              }
            />
            <span
              className="text-[10px] font-bold transition-colors"
              style={n <= active ? { color } : { color: "#d1d5db" }}
            >
              {n}
            </span>
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
  const [summaryTouched, setSummaryTouched] = useState(false);
  const [detailText,     setDetailText]     = useState("");
  const [detailTouched,  setDetailTouched]  = useState(false);
  const [wouldRecommend, setWouldRecommend] = useState<"yes" | "maybe" | "no" | null>(null);
  const [ownershipSlot,  setOwnershipSlot]  = useState<string>("");
  const [usageType,      setUsageType]      = useState<string>("");
  const [error,          setError]          = useState("");
  const [loading,        setLoading]        = useState(false);

  const scoresComplete = scoreFiyat > 0 && scoreKalite > 0 && scorePerformans > 0;
  const overall = scoresComplete
    ? calcOverall({ scoreFiyat, scoreKalite, scorePerformans })
    : null;

  const summaryValidation = validateSummary(summaryText);
  const detailValidation  = validateDetail(detailText);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!productSlug) { setError("Lütfen bir araç seçin."); return; }
    if (!scoresComplete) { setError("Lütfen tüm FI·KA·PE puanlarını verin."); return; }
    if (!summaryValidation.ok) {
      setSummaryTouched(true);
      setError(summaryValidation.error!);
      return;
    }
    if (!detailValidation.ok) {
      setDetailTouched(true);
      setError(detailValidation.error!);
      return;
    }

    setLoading(true);
    const res = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productSlug, scoreFiyat, scoreKalite, scorePerformans,
        summaryText, detailText,
        wouldBuyAgain: wouldRecommend === "yes" ? true : wouldRecommend === "no" ? false : null,
        ownershipMonths: OWNERSHIP_MONTHS[ownershipSlot] ?? null,
        usageType: usageType || null,
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
          <div className="flex gap-3 items-center mt-1 p-3 rounded-xl bg-gray-50 border border-gray-100">
            {/* Fotoğraf */}
            <div className="w-24 h-16 rounded-lg overflow-hidden bg-gray-100 shrink-0 flex items-center justify-center">
              {selectedProduct.imageUrl ? (
                <img
                  src={selectedProduct.imageUrl}
                  alt={selectedProduct.modelName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-2xl">🚗</span>
              )}
            </div>

            {/* Bilgiler */}
            <div className="flex-1 min-w-0 space-y-1">
              <p className="text-sm font-bold text-gray-900 leading-tight">
                {selectedProduct.brandName} {selectedProduct.modelName}
                {selectedProduct.trimName && (
                  <span className="font-normal text-gray-500"> · {selectedProduct.trimName}</span>
                )}
              </p>
              {selectedProduct.year && (
                <p className="text-xs text-gray-400">{selectedProduct.year}</p>
              )}
              <div className="flex flex-wrap gap-1 mt-1">
                {selectedProduct.fuelType && FUEL_LABELS[selectedProduct.fuelType] && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-200 text-gray-600">
                    {FUEL_LABELS[selectedProduct.fuelType]}
                  </span>
                )}
                {selectedProduct.bodyType && BODY_LABELS[selectedProduct.bodyType] && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-200 text-gray-600">
                    {BODY_LABELS[selectedProduct.bodyType]}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* FI·KA·PE Puanlama */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-5">
        <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide">
          fi·ka·pe Puanı
        </h2>

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

        {/* Genel skor — 3 boyut seçilince açılır */}
        {overall !== null && (() => {
          const o = overall;
          const style =
            o >= 9 ? { color: "#14532d", bg: "#dcfce7" } :
            o >= 7 ? { color: "#0C447C", bg: "#dbeafe" } :
            o >= 5 ? { color: "#9a3412", bg: "#ffedd5" } :
                     { color: "#991b1b", bg: "#fee2e2" };
          return (
            <div
              className="rounded-2xl px-6 py-5 text-center space-y-3 transition-all"
              style={{ background: style.bg }}
            >
              <p className="text-xs font-bold uppercase tracking-widest opacity-60"
                style={{ color: style.color }}>
                fi·ka·pe puanı
              </p>
              <p className="text-7xl font-black leading-none tabular-nums"
                style={{ color: style.color }}>
                {o.toFixed(1)}
              </p>
              {/* Progress bar */}
              <div className="w-full max-w-xs mx-auto h-1.5 rounded-full overflow-hidden"
                style={{ background: `${style.color}22` }}>
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${(o / 10) * 100}%`, background: style.color }}
                />
              </div>
              <p className="text-sm font-semibold" style={{ color: style.color }}>
                {SCORE_LABELS[Math.round(o)]}
              </p>
            </div>
          );
        })()}
      </div>

      {/* Özet */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Kısa Özet</h2>
          <span className={`text-xs ${summaryText.length >= 480 ? "text-orange-400" : "text-gray-400"}`}>
            {summaryText.length}/500
          </span>
        </div>
        <textarea
          value={summaryText}
          onChange={(e) => setSummaryText(e.target.value.slice(0, 500))}
          onBlur={() => setSummaryTouched(true)}
          rows={3}
          placeholder="Bu aracı tek cümleyle özetleyin..."
          className="w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none resize-none transition-colors"
          style={{
            borderColor: summaryTouched
              ? summaryValidation.ok ? "#86efac" : "#fca5a5"
              : "#e5e7eb",
          }}
        />
        {summaryTouched && (
          <FieldFeedback error={summaryValidation.error} ok={summaryValidation.ok} />
        )}
      </div>

      {/* Detay */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
        <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide">
          Detaylı Yorum <span className="text-gray-400 font-normal normal-case">(opsiyonel)</span>
        </h2>
        <textarea
          value={detailText}
          onChange={(e) => setDetailText(e.target.value)}
          onBlur={() => { if (detailText.trim()) setDetailTouched(true); }}
          rows={5}
          placeholder="Araçla ilgili detaylı deneyimlerinizi paylaşın..."
          className="w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none resize-none transition-colors"
          style={{
            borderColor: detailTouched
              ? detailValidation.ok ? "#86efac" : "#fca5a5"
              : "#e5e7eb",
          }}
        />
        {detailTouched && (
          <FieldFeedback error={detailValidation.error} ok={detailValidation.ok} />
        )}
      </div>

      {/* Ek bilgiler */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-7">
        <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Ek Bilgiler</h2>

        {/* Tavsiye */}
        <div className="space-y-3">
          <p className="text-base font-semibold text-gray-800">
            Bu aracı bir arkadaşınıza tavsiye eder misiniz?
          </p>
          <div className="flex gap-2">
            {RECOMMEND_OPTS.map((opt) => {
              const selected = wouldRecommend === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setWouldRecommend(opt.value)}
                  className="flex-1 py-3 rounded-xl font-semibold border-2 transition-all flex flex-col items-center gap-1"
                  style={
                    selected
                      ? { background: "#111", borderColor: "#111", color: "#fff" }
                      : { background: "#f9fafb", borderColor: "#e5e7eb", color: "#6b7280" }
                  }
                >
                  <span className="text-xl">{opt.icon}</span>
                  <span className="text-xs">{opt.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Sahiplik süresi */}
        <div className="space-y-3">
          <p className="text-base font-semibold text-gray-800">
            Aracınızı ne kadar süredir kullanıyorsunuz?
          </p>
          <div className="flex flex-wrap gap-2">
            {OWNERSHIP_SLOTS.map((slot) => {
              const selected = ownershipSlot === slot.key;
              return (
                <button
                  key={slot.key}
                  type="button"
                  onClick={() => setOwnershipSlot(slot.key)}
                  className="px-4 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all"
                  style={
                    selected
                      ? { background: "#111", borderColor: "#111", color: "#fff" }
                      : { background: "#f9fafb", borderColor: "#e5e7eb", color: "#6b7280" }
                  }
                >
                  {slot.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Kullanım tipi */}
        <div className="space-y-3">
          <p className="text-base font-semibold text-gray-800">
            Aracınızı çoğunlukla nerede kullanıyorsunuz?
          </p>
          <div className="flex gap-2">
            {USAGE_OPTS.map((opt) => {
              const selected = usageType === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setUsageType(opt.value)}
                  className="flex-1 py-3 rounded-xl font-semibold border-2 transition-all flex flex-col items-center gap-1"
                  style={
                    selected
                      ? { background: "#111", borderColor: "#111", color: "#fff" }
                      : { background: "#f9fafb", borderColor: "#e5e7eb", color: "#6b7280" }
                  }
                >
                  <span className="text-xl">{opt.icon}</span>
                  <span className="text-xs">{opt.label}</span>
                </button>
              );
            })}
          </div>
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
