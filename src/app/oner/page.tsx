"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import vehiclesData from "@/data/vehicles.json";
import { MODEL_GEN_RANGE_RE } from "@/lib/modelDisplay";

// Versiyon string'lerindeki RWD/AWD kısaltmaları teknik/İngilizce — kullanıcıya
// gösterirken Türkiye'de yaygın kullanılan "4x2"/"4x4" karşılığı eklenir.
// Sadece GÖRÜNÜMDE: değer (value, form state, trimsByVersion eşleşmeleri)
// hep orijinal string kalır, hiçbir veri değişmez.
function formatVersionLabel(version: string): string {
  return version
    .replace(/\bRWD\b/g, "RWD(4x2)")
    .replace(/\bAWD\b/g, "AWD(4x4)");
}

const CATEGORIES = [
  { value: "otomobil",   label: "Otomobil" },
  { value: "motosiklet", label: "Motosiklet" },
  { value: "e-scooter",  label: "E-Scooter" },
  { value: "e-bisiklet", label: "E-Bisiklet" },
  { value: "karavan",    label: "Karavan" },
  { value: "kamyonet",   label: "Kamyonet" },
] as const;

const FUEL_TYPES: Record<string, { value: string; label: string }[]> = {
  otomobil: [
    { value: "GASOLINE", label: "Benzin" },
    { value: "DIESEL",   label: "Dizel" },
    { value: "EV",       label: "Elektrikli (EV)" },
    { value: "PHEV",     label: "Plug-in Hibrit (PHEV)" },
    { value: "HYBRID",   label: "Hibrit" },
    { value: "LPG",      label: "LPG" },
  ],
  motosiklet: [
    { value: "GASOLINE", label: "Benzin" },
    { value: "EV",       label: "Elektrikli" },
  ],
  kamyonet: [
    { value: "GASOLINE", label: "Benzin" },
    { value: "DIESEL",   label: "Dizel" },
    { value: "EV",       label: "Elektrikli" },
    { value: "PHEV",     label: "Plug-in Hibrit (PHEV)" },
    { value: "HYBRID",   label: "Hibrit" },
    { value: "LPG",      label: "LPG" },
  ],
};

const TRANSMISSIONS: Record<string, { value: string; label: string }[]> = {
  otomobil: [
    { value: "Manuel",        label: "Manuel" },
    { value: "Otomatik",      label: "Otomatik" },
    { value: "CVT",           label: "CVT" },
    { value: "Yarı Otomatik", label: "Yarı Otomatik" },
  ],
  motosiklet: [
    { value: "Manuel",   label: "Manuel" },
    { value: "Otomatik", label: "Otomatik" },
  ],
  kamyonet: [
    { value: "Manuel",        label: "Manuel" },
    { value: "Otomatik",      label: "Otomatik" },
    { value: "Yarı Otomatik", label: "Yarı Otomatik" },
  ],
};

const YEARS = Array.from({ length: 2026 - 1990 + 1 }, (_, i) => 2026 - i);

// Model adının sonundaki "(2004-2012)" / "(2020-)" gibi nesil aralığını ayıklar
function getModelYearRange(modelName: string): [number, number] | null {
  const match = modelName.match(MODEL_GEN_RANGE_RE);
  if (!match) return null;
  const start = parseInt(match[1], 10);
  const end = match[2] ? parseInt(match[2], 10) : new Date().getFullYear();
  return [start, end];
}

// Versiyon metninden (motor kodundan) muhtemel yakıt tipini tahmin eder — kullanıcı isterse değiştirebilir
function detectFuelType(version: string): string | null {
  const v = version.toUpperCase();
  if (v.includes("KWH") || v.includes("ELECTRIC") || v.includes("ELEKTRİK") || v.includes("ELEKTRIK")) return "EV";
  if (v.includes("PHEV") || v.includes("PLUG-IN")) return "PHEV";
  if (v.includes("HEV") || v.includes("HYBRID") || v.includes("HİBRİT")) return "HYBRID";
  if (v.includes("LPG") || v.includes("ECO-G")) return "LPG";
  if (
    v.includes("DCI") || v.includes("TDI") || v.includes("CRDI") || v.includes("CDI") ||
    v.includes("BLUEHDI") || v.includes("HDI") || v.includes("DIESEL") || v.includes("DİZEL")
  ) return "DIESEL";
  // BMW/Mercedes "d" soneki: 116d, 220d, 400d — büyük harfli "4WD"/"AWD" ile karışmasın diye orijinal (küçük harf) string'de kontrol edilir
  if (/\dd(?![a-zA-Z])/.test(version)) return "DIESEL";
  return "GASOLINE";
}

type CategoryKey = keyof typeof vehiclesData;

export default function OnerPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [categorySlug, setCategorySlug] = useState<CategoryKey>("otomobil");
  const [selectedMake, setSelectedMake]   = useState("");
  const [customMake, setCustomMake]       = useState("");
  const [selectedModel, setSelectedModel] = useState("");
  const [customModel, setCustomModel]     = useState("");
  const [selectedVersion, setSelectedVersion] = useState("");
  const [customVersion, setCustomVersion]     = useState("");
  const [selectedTrim, setSelectedTrim]   = useState("");
  const [customTrim, setCustomTrim]       = useState("");
  const [year, setYear]         = useState("");
  const [fuelType, setFuelType] = useState("");
  const [transmission, setTransmission] = useState("");
  const [notes, setNotes]       = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState<string | null>(null);


  const makes      = vehiclesData[categorySlug] ?? [];
  const makeEntry  = makes.find((m) => m.make === selectedMake);
  const models     = (makeEntry?.models ?? []) as {
    name: string;
    versions: string[];
    trims: string[];
    // Opsiyonel — bazı modellerde versiyona göre hangi donanım paketinin
    // gerçekten satıldığı araştırılıp eşlenmiş (örn. "N AWD ..." versiyonu
    // sadece "N" paketiyle gelir). Bu eşleme yoksa (henüz araştırılmamış
    // modeller) tüm `trims` listesi gösterilir — geriye dönük bozulma olmaz.
    trimsByVersion?: Record<string, string[]>;
  }[];
  const modelEntry = models.find((m) => m.name === selectedModel);
  const versions   = modelEntry?.versions ?? [];
  const trimsForSelectedVersion =
    selectedVersion && selectedVersion !== "Diğer"
      ? modelEntry?.trimsByVersion?.[selectedVersion]
      : undefined;
  const trims = trimsForSelectedVersion ?? modelEntry?.trims ?? [];

  const isOtherMake    = selectedMake === "Diğer / Bulamadım";
  const isOtherModel   = selectedModel === "Diğer";
  const isOtherVersion = selectedVersion === "Diğer";
  const isOtherTrim    = selectedTrim === "Diğer";

  function handleCategoryChange(val: string) {
    setCategorySlug(val as CategoryKey);
    setSelectedMake(""); setCustomMake("");
    setSelectedModel(""); setCustomModel("");
    setSelectedVersion(""); setCustomVersion("");
    setSelectedTrim(""); setCustomTrim("");
    setFuelType("");
    setTransmission("");
  }

  function handleMakeChange(val: string) {
    setSelectedMake(val);
    setCustomMake("");
    setSelectedModel(""); setCustomModel("");
    setSelectedVersion(""); setCustomVersion("");
    setSelectedTrim(""); setCustomTrim("");
  }

  function handleModelChange(val: string) {
    setSelectedModel(val);
    setSelectedVersion(""); setCustomVersion("");
    setSelectedTrim(""); setCustomTrim("");
    setYear("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const brandName  = isOtherMake     ? customMake.trim()  : selectedMake;
    const modelName  = isOtherModel   ? customModel.trim()  : selectedModel;
    const versionFin = isOtherVersion ? customVersion.trim() : selectedVersion;
    const trimFin    = isOtherTrim    ? customTrim.trim()    : selectedTrim;

    if (!brandName || !modelName) {
      setError("Lütfen marka ve model seçiniz.");
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      // Kürate edilmiş versiyon listesi (vehicles.json) yakıt tipi tahmini için
      // güç+batarya rakamlarını metne gömüyor (örn. "Extended Range 204 72.8kWh")
      // — bu rakamlar zaten ayrı attributes alanlarında tutulacağı için burada
      // (kullanıcıya gösterilecek trimName'de) tekrar etmesin.
      const versionClean = versionFin.replace(/\s+\d+\s+\d+(\.\d+)?\s*kwh\b/i, "").trim();
      const trimName = [versionClean, trimFin].filter(Boolean).join(" – ") || "";
      const res = await fetch("/api/oneriler", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brandName, modelName, year, categorySlug, fuelType, transmission, trimName, notes }),
      });
      const text = await res.text();
      let data: Record<string, unknown> = {};
      try { data = text ? JSON.parse(text) : {}; } catch { throw new Error("Sunucu geçersiz yanıt döndürdü"); }

      if (res.status === 409 && data.existingSlug) {
        // Araç zaten aktif katalogda
        router.push(`/yorum-yaz?arac=${data.existingSlug}`);
        return;
      }
      if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : "Bir hata oluştu");

      // Başarı — yorum formuna yönlendir
      router.push(`/yorum-yaz?arac=${data.slug}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bir hata oluştu");
      setSubmitting(false);
    }
  }

  if (status === "loading") {
    return <div className="py-20 text-center text-sm text-gray-400">Yükleniyor...</div>;
  }

  if (!session) {
    return (
      <div className="py-20 flex justify-center px-4 bg-gray-50">
        <div className="w-full max-w-[480px] bg-white rounded-2xl border border-gray-100 shadow-sm p-7">
          <h1 className="flex items-center gap-2 text-lg font-bold text-gray-900 mb-3">
            <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400" aria-hidden="true">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            Araç Öner
          </h1>
          <p className="text-sm text-gray-500 leading-relaxed mb-2">
            Listede olmayan bir aracı önerin, deneyiminizi paylaşın.
          </p>
          <p className="text-sm text-gray-400 leading-relaxed mb-6">
            Devam etmek için bir fikape hesabına ihtiyacın var.
          </p>
          <div className="flex gap-2">
            <Link href="/giris?callbackUrl=/oner" className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white text-center" style={{ background: "#111" }}>
              Giriş yap
            </Link>
            <Link href="/kayit" className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-gray-700 text-center border border-gray-200 hover:bg-gray-50 transition-colors">
              Kayıt ol →
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const fuelOptions = FUEL_TYPES[categorySlug] ?? [];
  const transmissionOptions = TRANSMISSIONS[categorySlug] ?? [];
  const modelYearRange = !isOtherModel ? getModelYearRange(selectedModel) : null;
  const availableYears = modelYearRange
    ? Array.from({ length: modelYearRange[1] - modelYearRange[0] + 1 }, (_, i) => modelYearRange[1] - i)
    : YEARS;

  return (
    <div className="max-w-[480px] mx-auto px-4 py-10">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-gray-900 mb-1">Araç Öner</h1>
        <p className="text-sm text-gray-500">Listede olmayan bir aracı önerin.</p>
      </div>

      {/* Bilgi notu */}
      <div className="mb-6 px-4 py-3 rounded-xl bg-blue-50 border border-blue-100 text-sm text-blue-700 leading-relaxed">
        Aracı ekledikten sonra isterseniz yorum da yazabilirsiniz — zorunlu değil. Moderatörümüz inceleyip onaylayacak.
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* Araç Tipi */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            Araç Tipi <span className="text-red-500">*</span>
          </label>
          <select
            value={categorySlug}
            onChange={(e) => handleCategoryChange(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gray-400 bg-white"
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>

        {/* Marka */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            Marka <span className="text-red-500">*</span>
          </label>
          <select
            value={selectedMake}
            onChange={(e) => handleMakeChange(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gray-400 bg-white"
          >
            <option value="">— Marka seçin —</option>
            {makes.map((m) => (
              <option key={m.make} value={m.make}>{m.make}</option>
            ))}
          </select>
          {isOtherMake && (
            <input
              type="text"
              value={customMake}
              onChange={(e) => setCustomMake(e.target.value)}
              placeholder="Marka adını yazınız"
              className="mt-2 w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gray-400"
              autoFocus
            />
          )}
        </div>

        {/* Model */}
        {selectedMake && (
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Model <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedModel}
              onChange={(e) => handleModelChange(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gray-400 bg-white"
            >
              <option value="">— Model seçin —</option>
              {models.map((m) => (
                <option key={m.name} value={m.name}>{m.name}</option>
              ))}
            </select>
            {isOtherModel && (
              <input
                type="text"
                value={customModel}
                onChange={(e) => setCustomModel(e.target.value)}
                placeholder="Model adını yazınız"
                className="mt-2 w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gray-400"
                autoFocus
              />
            )}
          </div>
        )}

        {/* Versiyon */}
        {selectedModel && !isOtherModel && versions.length > 0 && (
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Versiyon</label>
            <select
              value={selectedVersion}
              onChange={(e) => {
                const val = e.target.value;
                setSelectedVersion(val); setCustomVersion(""); setSelectedTrim(""); setCustomTrim("");
                if (val && val !== "Diğer") {
                  const detected = detectFuelType(val);
                  if (detected && fuelOptions.some((f) => f.value === detected)) {
                    setFuelType(detected);
                  }
                }
              }}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gray-400 bg-white"
            >
              <option value="">— Seçin (opsiyonel) —</option>
              {versions.map((v) => <option key={v} value={v}>{formatVersionLabel(v)}</option>)}
            </select>
            {isOtherVersion && (
              <input type="text" value={customVersion} onChange={(e) => setCustomVersion(e.target.value)}
                placeholder="Versiyon bilgisi yazınız"
                className="mt-2 w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gray-400" autoFocus />
            )}
          </div>
        )}

        {/* Donanım */}
        {selectedModel && !isOtherModel && trims.length > 0 && (
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Donanım Paketi</label>
            <select
              value={selectedTrim}
              onChange={(e) => { setSelectedTrim(e.target.value); setCustomTrim(""); }}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gray-400 bg-white"
            >
              <option value="">— Seçin (opsiyonel) —</option>
              {trims.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            {isOtherTrim && (
              <input type="text" value={customTrim} onChange={(e) => setCustomTrim(e.target.value)}
                placeholder="Donanım paketi yazınız"
                className="mt-2 w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gray-400" autoFocus />
            )}
          </div>
        )}

        {/* Yıl & Yakıt & Vites */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Yıl</label>
            <select value={year} onChange={(e) => setYear(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gray-400 bg-white">
              <option value="">— Seçin —</option>
              {availableYears.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          {fuelOptions.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Yakıt Tipi</label>
              <select value={fuelType} onChange={(e) => setFuelType(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gray-400 bg-white">
                <option value="">— Seçin —</option>
                {fuelOptions.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
              </select>
            </div>
          )}
          {transmissionOptions.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Vites Tipi</label>
              <select value={transmission} onChange={(e) => setTransmission(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gray-400 bg-white">
                <option value="">— Seçin —</option>
                {transmissionOptions.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
          )}
        </div>

        {/* Not */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            Ek Bilgi <span className="text-gray-400 font-normal">(opsiyonel)</span>
          </label>
          <textarea
            value={notes} onChange={(e) => setNotes(e.target.value)}
            maxLength={500} rows={2}
            placeholder="Araç hakkında eklemek istediğiniz bilgiler..."
            className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gray-400 resize-none"
          />
          <p className="text-right text-xs text-gray-400 mt-0.5">{notes.length}/500</p>
        </div>

        {error && (
          <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-sm text-red-600">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3 rounded-xl text-sm font-bold text-white transition-opacity disabled:opacity-60"
          style={{ background: "#111" }}
        >
          {submitting ? "Oluşturuluyor..." : "Aracı Öner"}
        </button>

        <p className="text-center text-xs text-gray-400">
          Araç eklendikten sonra dilerseniz deneyiminizi de paylaşabilirsiniz — yorum yazmak zorunlu değil.
        </p>
      </form>
    </div>
  );
}
