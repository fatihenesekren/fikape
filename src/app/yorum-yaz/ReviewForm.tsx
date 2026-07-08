"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { calcOverall, FIKAPE, SCORE_LABELS } from "@/lib/fikape";
import { validateDetailShort } from "@/lib/reviewValidation";
import { FUEL_ICONS, FUEL_LABELS, FUEL_COLORS } from "@/lib/fuel";
import { getChipsForCategory, type Chip } from "@/lib/chips";

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
  categorySlug: string | null;
}

interface Props {
  products: Product[];
  defaultSlug?: string;
  reviewedSlugs?: string[];
}

const OWNERSHIP_SLOTS = [
  { key: "new",    label: "Yeni aldım", months: 2  },
  { key: "mid",    label: "3–12 ay",    months: 6  },
  { key: "one3",   label: "1–3 yıl",    months: 24 },
  { key: "three5", label: "3–5 yıl",    months: 48 },
  { key: "five",   label: "5 yıl+",     months: 72 },
];
const OWNERSHIP_MONTHS: Record<string, number> = Object.fromEntries(
  OWNERSHIP_SLOTS.map((s) => [s.key, s.months])
);

const RECOMMEND_OPTS = [
  { value: "yes",   icon: "👍", label: "Evet" },
  { value: "maybe", icon: "🤷", label: "Kararsızım" },
  { value: "no",    icon: "👎", label: "Hayır" },
] as const;

const USAGE_OPTS = [
  { value: "city",    icon: "🏙️", label: "Şehir içi" },
  { value: "highway", icon: "🛣️", label: "Şehirlerarası" },
  { value: "mixed",   icon: "🔀", label: "Karma" },
] as const;

const ROAD_OPTS = [
  { value: "very_good", label: "Çok iyi" },
  { value: "good",      label: "İyi" },
  { value: "okay",      label: "Orta" },
  { value: "poor",      label: "Kötü" },
] as const;

const FUEL_CONSUMPTION_OPTS = [
  { value: "matches",      label: "Katalogla örtüşüyor" },
  { value: "slightly_over",label: "%10–20 fazla" },
  { value: "much_over",    label: "%20+ fazla" },
] as const;

const LPG_OPTS = [
  { value: "factory",   label: "Fabrika LPG" },
  { value: "converted", label: "Sonradan dönüştürüldü" },
  { value: "none",      label: "LPG yok" },
] as const;

const EV_RANGE_OPTS = [
  { value: "matches",      label: "Katalogla örtüşüyor" },
  { value: "slightly_less",label: "Biraz az" },
  { value: "much_less",    label: "Çok az" },
] as const;

const CHARGING_ACCESS_OPTS = [
  { value: "easy",      label: "Kolay buluyorum" },
  { value: "sometimes", label: "Bazen sıkıntı" },
  { value: "hard",      label: "Çok zor" },
] as const;

const WINTER_RANGE_OPTS = [
  { value: "minimal",    label: "Az etkileniyor" },
  { value: "noticeable", label: "Belirgin kayıp" },
  { value: "severe",     label: "Çok fazla kayıp" },
] as const;

const EBIKE_USAGE_OPTS = [
  { value: "sehir", icon: "🏙️", label: "Şehir" },
  { value: "mtb",   icon: "🏔️", label: "MTB" },
  { value: "yol",   icon: "🛣️", label: "Yol" },
  { value: "kargo", icon: "📦", label: "Kargo" },
] as const;

const EBIKE_MOTOR_OPTS = [
  { value: "mid-drive", label: "Mid-Drive" },
  { value: "hub-drive", label: "Hub-Drive" },
] as const;

const EBIKE_PEDELEC_OPTS = [
  { value: "standard-25", label: "25 km/h Standart" },
  { value: "speed-45",    label: "45 km/h Speed" },
] as const;

const EBIKE_WINTER_OPTS = [
  { value: "minimal",     label: "Az etkileniyor" },
  { value: "fark-edilir", label: "Belirgin kayıp" },
  { value: "ciddi",       label: "Çok fazla kayıp" },
] as const;

function ChipGroup<T extends string>({
  opts, value, onChange, cols,
}: {
  opts: readonly { value: T; label: string }[];
  value: T | "";
  onChange: (v: T) => void;
  cols?: number;
}) {
  return (
    <div
      className="flex flex-wrap gap-2"
      style={cols ? { display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)` } : undefined}
    >
      {opts.map((opt) => {
        const selected = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all text-center"
            style={
              selected
                ? { background: "#111", borderColor: "#111", color: "#fff" }
                : { background: "#f9fafb", borderColor: "#e5e7eb", color: "#6b7280" }
            }
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function IconChipGroup<T extends string>({
  opts, value, onChange,
}: {
  opts: readonly { value: T; icon: string; label: string }[];
  value: T | null | "";
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex gap-2">
      {opts.map((opt) => {
        const selected = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
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
  );
}

function YesNo({ value, onChange }: { value: boolean | null; onChange: (v: boolean) => void }) {
  return (
    <div className="flex gap-2">
      {([true, false] as const).map((v) => (
        <button
          key={String(v)}
          type="button"
          onClick={() => onChange(v)}
          className="flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all"
          style={
            value === v
              ? { background: "#111", borderColor: "#111", color: "#fff" }
              : { background: "#f9fafb", borderColor: "#e5e7eb", color: "#6b7280" }
          }
        >
          {v ? "Evet" : "Hayır"}
        </button>
      ))}
    </div>
  );
}

function SectionCard({ step, title, badge, children }: {
  step: number; title: string;
  badge?: "required" | "optional" | "conditional";
  children: React.ReactNode;
}) {
  const badgeStyles = {
    required:    { bg: "#fee2e2", color: "#991b1b", label: "Zorunlu" },
    optional:    { bg: "#f3f4f6", color: "#6b7280", label: "Opsiyonel" },
    conditional: { bg: "#fef3c7", color: "#92400e", label: "Koşullu" },
  };
  const b = badge ? badgeStyles[badge] : null;
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-5">
      <div className="flex items-center gap-3">
        <span
          className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
          style={{ background: "#E6F1FB", color: "#0C447C" }}
        >
          {step}
        </span>
        <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide flex-1">{title}</h2>
        {b && (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
            style={{ background: b.bg, color: b.color }}>
            {b.label}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

function SubQuestion({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2.5">
      <p className="text-sm font-semibold text-gray-800">
        {label}
        {hint && <span className="text-xs font-normal text-gray-400 ml-1.5">{hint}</span>}
      </p>
      {children}
    </div>
  );
}

function FieldFeedback({ error, ok }: { error: string | null; ok: boolean }) {
  if (!error && !ok) return null;
  if (ok) return (
    <p className="text-xs text-green-600 flex items-center gap-1"><span>✓</span> Görünüyor güzel!</p>
  );
  return (
    <p className="text-xs text-red-500 flex items-center gap-1"><span>⚠</span> {error}</p>
  );
}

function ScoreSelector({ label, short, color, bg, value, onChange }: {
  label: string; short: string; color: string; bg: string;
  value: number; onChange: (v: number) => void;
}) {
  const [hovered, setHovered] = useState(0);
  const active = hovered || value;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black"
            style={{ background: bg, color }}>
            {short}
          </span>
          <span className="text-sm font-semibold text-gray-700">{label}</span>
        </div>
        <div className="flex items-baseline gap-1.5 min-w-[90px] justify-end">
          {active > 0 ? (
            <>
              <span className="text-3xl font-black leading-none" style={{ color }}>{active}</span>
              <span className="text-xs font-medium" style={{ color }}>{SCORE_LABELS[active]}</span>
            </>
          ) : (
            <span className="text-xs text-gray-300">Puan ver</span>
          )}
        </div>
      </div>
      <div className="flex gap-1">
        {[1,2,3,4,5,6,7,8,9,10].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            onMouseEnter={() => setHovered(n)}
            onMouseLeave={() => setHovered(0)}
            className="flex-1 flex flex-col items-center gap-1"
          >
            <div
              className="w-full h-7 rounded-md transition-all duration-100"
              style={n <= active
                ? { background: color, opacity: 0.6 + (n / active) * 0.4 }
                : { background: "#f0f0f0" }}
            />
            <span className="text-[10px] font-bold transition-colors"
              style={n <= active ? { color } : { color: "#d1d5db" }}>
              {n}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function ProConChipSelector({ chips, pros, cons, onTogglePro, onToggleCon }: {
  chips: Chip[];
  pros: string[];
  cons: string[];
  onTogglePro: (key: string) => void;
  onToggleCon: (key: string) => void;
}) {
  const proAtMax = pros.length >= 3;
  const conAtMax = cons.length >= 3;

  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Artılar */}
      <div className="space-y-2">
        <p className="text-xs font-bold flex items-center justify-between" style={{ color: "#16a34a" }}>
          <span>+ Artılar</span>
          <span className="text-gray-400 font-normal">{pros.length}/3</span>
        </p>
        <div className="flex flex-wrap gap-1.5">
          {chips.map((c) => {
            const isPro = pros.includes(c.key);
            const isCon = cons.includes(c.key);
            const blocked = isCon || (proAtMax && !isPro);
            return (
              <button
                key={`pro-${c.key}`}
                type="button"
                onClick={() => !blocked && onTogglePro(c.key)}
                className="px-2.5 py-1 rounded-full text-xs font-semibold border transition-all"
                style={
                  isPro
                    ? { background: "#dcfce7", borderColor: "#86efac", color: "#16a34a" }
                    : blocked
                    ? { background: "#f9fafb", borderColor: "#e5e7eb", color: "#d1d5db", cursor: "default" }
                    : { background: "#f9fafb", borderColor: "#e5e7eb", color: "#6b7280" }
                }
              >
                {c.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Eksiler */}
      <div className="space-y-2">
        <p className="text-xs font-bold flex items-center justify-between" style={{ color: "#dc2626" }}>
          <span>− Eksiler</span>
          <span className="text-gray-400 font-normal">{cons.length}/3</span>
        </p>
        <div className="flex flex-wrap gap-1.5">
          {chips.map((c) => {
            const isCon = cons.includes(c.key);
            const isPro = pros.includes(c.key);
            const blocked = isPro || (conAtMax && !isCon);
            return (
              <button
                key={`con-${c.key}`}
                type="button"
                onClick={() => !blocked && onToggleCon(c.key)}
                className="px-2.5 py-1 rounded-full text-xs font-semibold border transition-all"
                style={
                  isCon
                    ? { background: "#fee2e2", borderColor: "#fca5a5", color: "#dc2626" }
                    : blocked
                    ? { background: "#f9fafb", borderColor: "#e5e7eb", color: "#d1d5db", cursor: "default" }
                    : { background: "#f9fafb", borderColor: "#e5e7eb", color: "#6b7280" }
                }
              >
                {c.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function ReviewForm({ products, defaultSlug, reviewedSlugs = [] }: Props) {
  const router = useRouter();

  // ── Araç arama ───────────────────────────────────────────────────────────
  const [searchQuery,   setSearchQuery]   = useState("");
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [dropdownOpen,  setDropdownOpen]  = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(
    defaultSlug ? (products.find((p) => p.slug === defaultSlug) ?? null) : null
  );

  // Debounced arama
  useEffect(() => {
    if (searchQuery.length < 2) { setSearchResults([]); return; }
    const t = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await fetch(`/api/search/products?q=${encodeURIComponent(searchQuery)}`);
        if (res.ok) setSearchResults(await res.json());
      } finally {
        setSearchLoading(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  // Dışarı tıklayınca dropdown kapansın
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  function handleSelectProduct(p: Product) {
    setSelectedProduct(p);
    setSearchQuery(`${p.brandName} ${p.modelName}${p.trimName ? ` · ${p.trimName}` : ""}${p.year ? ` (${p.year})` : ""}`);
    setDropdownOpen(false);
  }

  const productSlug = selectedProduct?.slug ?? "";
  const [scoreFiyat,      setScoreFiyat]      = useState(0);
  const [scoreKalite,     setScoreKalite]     = useState(0);
  const [scorePerformans, setScorePerformans] = useState(0);

  const [pros, setPros] = useState<string[]>([]);
  const [cons, setCons] = useState<string[]>([]);
  const [detailText,    setDetailText]    = useState("");
  const [detailTouched, setDetailTouched] = useState(false);
  const [photoUrls,     setPhotoUrls]     = useState<string[]>([]);
  const [photoUploading, setPhotoUploading] = useState(false);

  const [wouldRecommend,   setWouldRecommend]   = useState<"yes" | "maybe" | "no" | null>(null);
  const [ownershipSlot,    setOwnershipSlot]    = useState("");
  const [usageType,        setUsageType]        = useState("");

  const [roadDurability,   setRoadDurability]   = useState("");
  const [fuelConsumption,  setFuelConsumption]  = useState("");
  const [lpgStatus,        setLpgStatus]        = useState("");
  const [evRange,          setEvRange]          = useState("");
  const [homeCharging,     setHomeCharging]     = useState<boolean | null>(null);
  const [chargingAccess,   setChargingAccess]   = useState("");
  const [winterRange,      setWinterRange]      = useState("");

  const [ebikeMotorType,    setEbikeMotorType]    = useState("");
  const [ebikePedelecClass, setEbikePedelecClass] = useState("");
  const [ebikeRealRangeKm,  setEbikeRealRangeKm]  = useState("");
  const [ebikeWinterRange,  setEbikeWinterRange]  = useState("");
  const [ebikeChargeHours,  setEbikeChargeHours]  = useState("");

  const [error,   setError]   = useState("");
  const [loading, setLoading] = useState(false);
  const [mode,    setMode]    = useState<"quick" | "full">("quick");
  const isQuick = mode === "quick";

  // Chip listesini seçili araca göre hesapla
  const chips = getChipsForCategory(selectedProduct?.categorySlug ?? null);

  // Araç değişince chip seçimlerini sıfırla
  useEffect(() => {
    setPros([]);
    setCons([]);
  }, [selectedProduct?.slug]);

  function togglePro(key: string) {
    setPros((prev) => {
      if (prev.includes(key)) return prev.filter((k) => k !== key);
      if (prev.length >= 3) return prev;
      return [...prev, key];
    });
    setCons((prev) => prev.filter((k) => k !== key));
  }

  function toggleCon(key: string) {
    setCons((prev) => {
      if (prev.includes(key)) return prev.filter((k) => k !== key);
      if (prev.length >= 3) return prev;
      return [...prev, key];
    });
    setPros((prev) => prev.filter((k) => k !== key));
  }

  const alreadyReviewed = productSlug ? reviewedSlugs.includes(productSlug) : false;
  const fuelType    = selectedProduct?.fuelType ?? null;
  const catSlug     = selectedProduct?.categorySlug ?? null;
  const isEscooter  = catSlug === "e-scooter";
  const isEbisiklet = catSlug === "e-bisiklet";
  const isEV        = fuelType === "EV" || isEscooter;
  const isCombustion = !isEV && ["GASOLINE", "DIESEL", "HYBRID"].includes(fuelType ?? "");
  const isGasoline  = fuelType === "GASOLINE";

  const scoresComplete = scoreFiyat > 0 && scoreKalite > 0 && scorePerformans > 0;
  const overall = scoresComplete ? calcOverall({ scoreFiyat, scoreKalite, scorePerformans }) : null;
  const detailValidation = validateDetailShort(detailText);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!productSlug)    { setError("Lütfen bir araç seçin."); return; }
    if (alreadyReviewed) { setError("Bu araç için zaten bir yorumun var."); return; }
    if (!scoresComplete) { setError("Lütfen tüm FI·KA·PE puanlarını verin."); return; }
    if (!isQuick) {
      if (pros.length < 1) { setError("En az 1 artı seçin."); return; }
      if (cons.length < 1) { setError("En az 1 eksi seçin."); return; }
      if (!detailValidation.ok) { setDetailTouched(true); setError(detailValidation.error!); return; }
    }

    const extended: Record<string, unknown> = {};
    if (!isQuick) {
      if (usageType)      extended.usage_type      = usageType;
      if (roadDurability) extended.road_durability = roadDurability;
      if (isCombustion) {
        if (fuelConsumption) extended.fuel_consumption = fuelConsumption;
        if (isGasoline && lpgStatus) extended.lpg_status = lpgStatus;
      }
      if (isEV) {
        if (evRange)               extended.ev_range      = evRange;
        if (homeCharging !== null) extended.home_charging = homeCharging;
        if (!isEscooter && chargingAccess) extended.charging_access = chargingAccess;
        if (winterRange)           extended.winter_range  = winterRange;
      }
      if (isEbisiklet) {
        if (ebikeMotorType)    extended.motor_type_exp    = ebikeMotorType;
        if (ebikePedelecClass) extended.pedelec_class_exp = ebikePedelecClass;
        if (ebikeRealRangeKm)  extended.real_range_km     = Number(ebikeRealRangeKm);
        if (ebikeWinterRange)  extended.winter_range_ok   = ebikeWinterRange;
        if (ebikeChargeHours)  extended.charge_time_hours = Number(ebikeChargeHours);
      }
    }

    setLoading(true);
    const res = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productSlug, scoreFiyat, scoreKalite, scorePerformans,
        detailText:      isQuick ? "" : detailText,
        pros:             isQuick ? [] : pros,
        cons:             isQuick ? [] : cons,
        photoUrls:        isQuick ? undefined : (photoUrls.length ? photoUrls : undefined),
        wouldBuyAgain:    isQuick ? null : (wouldRecommend === "yes" ? true : wouldRecommend === "no" ? false : null),
        ownershipMonths:  isQuick ? null : (OWNERSHIP_MONTHS[ownershipSlot] ?? null),
        extendedData:     Object.keys(extended).length ? extended : undefined,
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error ?? "Bir hata oluştu."); return; }
    router.push(`/araclar/${productSlug}?yorum=gonderildi`);
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto px-4 py-10 space-y-6">

      <div>
        <h1 className="text-2xl font-black text-gray-900">Yorum yaz</h1>
        <p className="text-sm text-gray-500 mt-1">Deneyimini paylaş, diğer kullanıcılara yol göster.</p>
      </div>

      {defaultSlug && (
        <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-green-50 border border-green-100 text-sm text-green-700">
          <span>Aracınız eklendi ✓ — isterseniz deneyiminizi de paylaşabilirsiniz, zorunlu değil.</span>
          <Link
            href={`/araclar/${defaultSlug}`}
            className="shrink-0 text-xs font-semibold text-green-700 underline underline-offset-2 hover:text-green-800"
          >
            Şimdi değil, sonra yazarım →
          </Link>
        </div>
      )}

      <div className="flex gap-1 p-1 rounded-xl bg-gray-100">
        <button
          type="button"
          onClick={() => setMode("quick")}
          className="flex-1 py-2 rounded-lg text-sm font-bold transition-colors"
          style={mode === "quick" ? { background: "#111", color: "#fff" } : { color: "#6b7280" }}
        >
          ⚡ Hızlı Puanla
        </button>
        <button
          type="button"
          onClick={() => setMode("full")}
          className="flex-1 py-2 rounded-lg text-sm font-bold transition-colors"
          style={mode === "full" ? { background: "#111", color: "#fff" } : { color: "#6b7280" }}
        >
          📝 Detaylı Yorum
        </button>
      </div>
      {isQuick && (
        <p className="text-xs text-gray-400 -mt-3">
          10 saniyede puanla — istersen sonra artı/eksi ekleyerek güçlendirebilirsin.
        </p>
      )}

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
          {error}
        </div>
      )}

      {/* 1 — Araç */}
      <SectionCard step={1} title="Araç" badge="required">

        <div ref={searchRef} className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setSelectedProduct(null); setDropdownOpen(true); }}
              onFocus={() => { if (!selectedProduct && searchQuery.length >= 2) setDropdownOpen(true); }}
              placeholder="Araç ara... örn: Clio, Yaris, Megane"
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gray-400 bg-white"
            />

            {dropdownOpen && searchQuery.length >= 2 && (
              <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                {searchLoading && (
                  <div className="px-4 py-3 text-sm text-gray-400">Aranıyor...</div>
                )}
                {!searchLoading && searchResults.length === 0 && (
                  <div className="px-4 py-3 text-sm text-gray-400">Sonuç bulunamadı.</div>
                )}
                {!searchLoading && searchResults.map((p) => {
                  const fc = p.fuelType ? (FUEL_COLORS[p.fuelType] ?? null) : null;
                  return (
                    <button
                      key={p.slug}
                      type="button"
                      onMouseDown={() => handleSelectProduct(p)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 text-left transition-colors border-b border-gray-50 last:border-0"
                    >
                      <div className="w-10 h-8 rounded-md bg-gray-100 shrink-0 overflow-hidden flex items-center justify-center">
                        {p.imageUrl
                          ? <img src={p.imageUrl} alt={p.modelName} className="w-full h-full object-cover" />
                          : <span className="text-base">🚗</span>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {p.brandName} {p.modelName}
                          {p.trimName && <span className="font-normal text-gray-400"> · {p.trimName}</span>}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {p.year && <span className="text-xs text-gray-400">{p.year}</span>}
                          {fc && <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full" style={{ background: fc.bg, color: fc.text }}>{FUEL_ICONS[p.fuelType!]} {FUEL_LABELS[p.fuelType!]}</span>}
                        </div>
                      </div>
                    </button>
                  );
                })}
                <button
                  type="button"
                  onMouseDown={() => router.push("/oner?from=yorum-yaz")}
                  className="w-full px-4 py-3 text-sm font-semibold text-left text-blue-600 hover:bg-blue-50 transition-colors border-t border-gray-100"
                >
                  {searchResults.length === 0
                    ? <>+ &ldquo;{searchQuery}&rdquo; sistemde yok — araç öner</>
                    : <>Aradığın araç listede yok mu? + Araç öner</>}
                </button>
              </div>
            )}
        </div>

        {alreadyReviewed && (
          <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-amber-50 border border-amber-100 text-sm text-amber-800">
            <span>⚠</span>
            <span>Bu araç için zaten bir yorumun var. Her araç için tek yorum yazılabilir.</span>
          </div>
        )}

        {selectedProduct && (
          <div className="flex gap-3 items-center p-3 rounded-xl bg-gray-50 border border-gray-100">
            <div className="w-24 h-16 rounded-lg overflow-hidden bg-gray-100 shrink-0 flex items-center justify-center">
              {selectedProduct.imageUrl
                ? <img src={selectedProduct.imageUrl} alt={selectedProduct.modelName} className="w-full h-full object-cover" />
                : <span className="text-2xl">🚗</span>}
            </div>
            <div className="flex-1 min-w-0 space-y-1">
              <p className="text-sm font-bold text-gray-900 leading-tight">
                {selectedProduct.brandName} {selectedProduct.modelName}
                {selectedProduct.trimName && <span className="font-normal text-gray-500"> · {selectedProduct.trimName}</span>}
              </p>
              {selectedProduct.year && <p className="text-xs text-gray-400">{selectedProduct.year}</p>}
              <div className="flex flex-wrap gap-1 mt-1">
                {selectedProduct.fuelType && FUEL_LABELS[selectedProduct.fuelType] && (() => {
                  const fc = FUEL_COLORS[selectedProduct.fuelType!] ?? { bg: "#e5e7eb", text: "#374151" };
                  return (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: fc.bg, color: fc.text }}>
                      {FUEL_ICONS[selectedProduct.fuelType!]} {FUEL_LABELS[selectedProduct.fuelType!]}
                    </span>
                  );
                })()}
                {selectedProduct.bodyType && BODY_LABELS[selectedProduct.bodyType] && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-200 text-gray-600">
                    {BODY_LABELS[selectedProduct.bodyType]}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </SectionCard>

      {/* 2 — FI·KA·PE Puanı */}
      <SectionCard step={2} title="fi·ka·pe puanı" badge="required">
        {FIKAPE.map(({ key, short, label, color, bg }) => (
          <ScoreSelector
            key={key} short={short} label={label} color={color} bg={bg}
            value={key === "scoreFiyat" ? scoreFiyat : key === "scoreKalite" ? scoreKalite : scorePerformans}
            onChange={key === "scoreFiyat" ? setScoreFiyat : key === "scoreKalite" ? setScoreKalite : setScorePerformans}
          />
        ))}

        {overall !== null && (() => {
          const o = overall;
          const s = o >= 9 ? { color: "#14532d", bg: "#dcfce7" }
                  : o >= 7 ? { color: "#0C447C", bg: "#dbeafe" }
                  : o >= 5 ? { color: "#9a3412", bg: "#ffedd5" }
                  :          { color: "#991b1b", bg: "#fee2e2" };
          return (
            <div className="rounded-2xl px-6 py-5 text-center space-y-3" style={{ background: s.bg }}>
              <p className="text-xs font-bold uppercase tracking-widest opacity-60" style={{ color: s.color }}>fi·ka·pe puanı</p>
              <p className="text-7xl font-black leading-none tabular-nums" style={{ color: s.color }}>{o.toFixed(1)}</p>
              <div className="w-full max-w-xs mx-auto h-1.5 rounded-full overflow-hidden" style={{ background: `${s.color}22` }}>
                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${(o / 10) * 100}%`, background: s.color }} />
              </div>
              <p className="text-sm font-semibold" style={{ color: s.color }}>{SCORE_LABELS[Math.round(o)]}</p>
            </div>
          );
        })()}
      </SectionCard>

      {/* 3 — Artılar & Eksiler */}
      {!isQuick && (
      <SectionCard step={3} title="Artılar & Eksiler" badge="required">
        <p className="text-xs text-gray-400 -mt-2">
          Her kategoriden en az 1, en fazla 3 seçin.
        </p>

        <ProConChipSelector
          chips={chips}
          pros={pros}
          cons={cons}
          onTogglePro={togglePro}
          onToggleCon={toggleCon}
        />

        <div className="space-y-3 pt-1">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-800">
              Yorumun <span className="text-gray-400 font-normal">(opsiyonel)</span>
            </p>
            <span className={`text-xs ${detailText.length >= 260 ? "text-orange-400" : "text-gray-400"}`}>
              {detailText.length}/280
            </span>
          </div>
          <textarea
            value={detailText}
            onChange={(e) => setDetailText(e.target.value.slice(0, 280))}
            onBlur={() => { if (detailText.trim()) setDetailTouched(true); }}
            rows={4}
            placeholder="Deneyimini birkaç cümleyle anlat..."
            className="w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none resize-none transition-colors"
            style={{ borderColor: detailTouched ? (detailValidation.ok ? "#86efac" : "#fca5a5") : "#e5e7eb" }}
          />
          {detailTouched && <FieldFeedback error={detailValidation.error} ok={detailValidation.ok} />}
        </div>

        {/* Fotoğraf yükleme */}
        <div className="space-y-3 pt-1">
          <p className="text-sm font-semibold text-gray-800">
            Fotoğraf <span className="text-gray-400 font-normal">(opsiyonel, maks. 3)</span>
          </p>

          {photoUrls.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {photoUrls.map((url, idx) => (
                <div key={url} className="relative w-20 h-20 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt={`Fotoğraf ${idx + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setPhotoUrls((prev) => prev.filter((u) => u !== url))}
                    className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center text-xs leading-none hover:bg-black/80"
                    aria-label="Fotoğrafı kaldır"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          {photoUrls.length < 3 && (
            <label className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dashed text-sm font-semibold cursor-pointer transition-colors ${photoUploading ? "border-gray-200 text-gray-300" : "border-gray-300 text-gray-500 hover:border-gray-400 hover:text-gray-700"}`}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
              {photoUploading ? "Yükleniyor..." : `Fotoğraf seç (${photoUrls.length}/3)`}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                className="sr-only"
                disabled={photoUploading}
                onChange={async (e) => {
                  const files = Array.from(e.target.files ?? []);
                  const remaining = 3 - photoUrls.length;
                  const toUpload = files.slice(0, remaining);
                  setPhotoUploading(true);
                  for (const file of toUpload) {
                    const fd = new FormData();
                    fd.append("file", file);
                    const res = await fetch("/api/uploads/review-photo", { method: "POST", body: fd });
                    if (res.ok) {
                      const { url } = await res.json() as { url: string };
                      setPhotoUrls((prev) => [...prev, url]);
                    }
                  }
                  setPhotoUploading(false);
                  e.target.value = "";
                }}
              />
            </label>
          )}
          <p className="text-xs text-amber-600 font-medium">Fotoğraftaki plaka ve yüzleri gizli tutun — yüklemeden önce kendiniz kapatın ya da göstermeyin. Atlarsanız KVKK gereği moderasyon ekibimiz düzenler.</p>
          <p className="text-xs text-gray-400">JPEG, PNG veya WebP · maks. 5 MB · moderasyon onayından sonra yayınlanır</p>
        </div>
      </SectionCard>
      )}

      {/* 4 — Sahiplik & Kullanım */}
      {!isQuick && (
      <SectionCard step={4} title="Sahiplik & Kullanım" badge="optional">
        <SubQuestion label="Ne kadar süredir kullanıyorsunuz?">
          <div className="flex flex-wrap gap-2">
            {OWNERSHIP_SLOTS.map((slot) => (
              <button
                key={slot.key}
                type="button"
                onClick={() => setOwnershipSlot(slot.key)}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all"
                style={ownershipSlot === slot.key
                  ? { background: "#111", borderColor: "#111", color: "#fff" }
                  : { background: "#f9fafb", borderColor: "#e5e7eb", color: "#6b7280" }}
              >
                {slot.label}
              </button>
            ))}
          </div>
        </SubQuestion>

        <SubQuestion label="Çoğunlukla nerede kullanıyorsunuz?">
          {isEbisiklet
            ? <IconChipGroup opts={EBIKE_USAGE_OPTS} value={usageType} onChange={setUsageType} />
            : <IconChipGroup opts={USAGE_OPTS} value={usageType} onChange={setUsageType} />
          }
        </SubQuestion>

        <SubQuestion label="Bu aracı bir arkadaşınıza tavsiye eder misiniz?">
          <IconChipGroup opts={RECOMMEND_OPTS} value={wouldRecommend} onChange={setWouldRecommend} />
        </SubQuestion>
      </SectionCard>
      )}

      {/* 5 — Türkiye'ye Özel */}
      {!isQuick && (
      <SectionCard step={5} title="Türkiye'ye özel" badge="conditional">
        <p className="text-xs text-gray-400 -mt-2">
          Araç tipine göre sorular otomatik değişir. Hepsi opsiyoneldir.
        </p>

        <SubQuestion label="Türkiye yol koşullarına dayanıklılık?" hint="bozuk asfalt, kasis, çukur">
          <ChipGroup opts={ROAD_OPTS} value={roadDurability} onChange={setRoadDurability} />
        </SubQuestion>

        {isCombustion && (
          <>
            <SubQuestion label="Gerçek yakıt tüketimi katalogla örtüşüyor mu?">
              <ChipGroup opts={FUEL_CONSUMPTION_OPTS} value={fuelConsumption} onChange={setFuelConsumption} />
            </SubQuestion>

            {isGasoline && (
              <SubQuestion label="LPG durumu">
                <ChipGroup opts={LPG_OPTS} value={lpgStatus} onChange={setLpgStatus} />
              </SubQuestion>
            )}
          </>
        )}

        {isEbisiklet && (
          <>
            <SubQuestion label="Motor tipi">
              <ChipGroup opts={EBIKE_MOTOR_OPTS} value={ebikeMotorType} onChange={setEbikeMotorType} />
            </SubQuestion>

            <SubQuestion label="Pedelec sınıfı">
              <ChipGroup opts={EBIKE_PEDELEC_OPTS} value={ebikePedelecClass} onChange={setEbikePedelecClass} />
            </SubQuestion>

            <SubQuestion label="Gerçek menzil (km)" hint="opsiyonel">
              <input
                type="number"
                min={0}
                value={ebikeRealRangeKm}
                onChange={(e) => setEbikeRealRangeKm(e.target.value)}
                placeholder="örn. 45"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gray-400"
              />
            </SubQuestion>

            <SubQuestion label="Kışın menzil kaybı">
              <ChipGroup opts={EBIKE_WINTER_OPTS} value={ebikeWinterRange} onChange={setEbikeWinterRange} />
            </SubQuestion>

            <SubQuestion label="Tam şarj süresi (saat)" hint="opsiyonel">
              <input
                type="number"
                min={0}
                step={0.5}
                value={ebikeChargeHours}
                onChange={(e) => setEbikeChargeHours(e.target.value)}
                placeholder="örn. 4"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gray-400"
              />
            </SubQuestion>
          </>
        )}

        {isEV && (
          <>
            <SubQuestion label="Gerçek menzil katalogla örtüşüyor mu?">
              <ChipGroup opts={EV_RANGE_OPTS} value={evRange} onChange={setEvRange} />
            </SubQuestion>

            <SubQuestion label="Ev şarjı yapabiliyor musunuz?">
              <YesNo value={homeCharging} onChange={setHomeCharging} />
            </SubQuestion>

            {!isEscooter && (
              <SubQuestion label="Bölgenizde şarj istasyonu bulmak kolay mı?">
                <ChipGroup opts={CHARGING_ACCESS_OPTS} value={chargingAccess} onChange={setChargingAccess} />
              </SubQuestion>
            )}

            <SubQuestion label="Kışın menzil kaybı yaşıyor musunuz?">
              <ChipGroup opts={WINTER_RANGE_OPTS} value={winterRange} onChange={setWinterRange} />
            </SubQuestion>
          </>
        )}
      </SectionCard>
      )}

      <button
        type="submit"
        disabled={loading || alreadyReviewed}
        className="w-full py-3.5 rounded-xl text-sm font-bold text-white transition-colors disabled:opacity-60"
        style={{ background: "#111" }}
      >
        {loading ? "Gönderiliyor..." : isQuick ? "Hızlı Gönder →" : "Yorumu Gönder →"}
      </button>

      <p className="text-xs text-center text-gray-400">
        Yorumunuz moderasyon onayından sonra yayınlanacaktır.
      </p>

    </form>
  );
}
