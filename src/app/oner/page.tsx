"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import vehiclesData from "@/data/vehicles.json";
import { parseVersion, formatVersionLabel, versionForTrimName } from "@/lib/parseVersion";
import { MODEL_GEN_RANGE_RE } from "@/lib/modelDisplay";
import { resolveOnerPrefill, type OnerCategoryKey } from "@/lib/onerPrefill";
import type { ExistingVehicleMatch } from "@/lib/existingVehicle";
import KatalogAracSecimi, { type KatalogSecimSonucu } from "./KatalogAracSecimi";

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
  if (v.includes("HEV") || v.includes("HYBRID") || v.includes("HİBRİT") || v.includes("HIBRIT")) return "HYBRID";
  if (v.includes("LPG") || v.includes("ECO-G")) return "LPG";
  if (
    v.includes("DCI") || v.includes("TDI") || v.includes("CRDI") || v.includes("CDI") || v.includes("DDIS") ||
    v.includes("BLUEHDI") || v.includes("HDI") || v.includes("DIESEL") || v.includes("DİZEL") || v.includes("DIZEL")
  ) return "DIESEL";
  // BMW/Mercedes "d" soneki: 116d, 220d, 400d — büyük harfli "4WD"/"AWD" ile karışmasın diye orijinal (küçük harf) string'de kontrol edilir
  if (/\dd(?![a-zA-Z])/.test(version)) return "DIESEL";
  return "GASOLINE";
}

type CategoryKey = OnerCategoryKey;

export default function OnerPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // /arama "eşleşme yok" akışından gelen sorguyu (`?q=`, eski linklerde
  // `?brandName=`) forma çöz. Lazy useState — /oner session çözülene kadar
  // sunucuda "Yükleniyor" render ettiği için form alanlarında hydration
  // uyuşmazlığı riski yok (window sadece istemcide okunur).
  const [prefill] = useState(() =>
    resolveOnerPrefill(typeof window === "undefined" ? "" : window.location.search),
  );

  // "" = seçilmemiş ("— Araç tipi seçin —"). Diğer select'lerle tutarlı +
  //  Marka/Yakıt/Vites listeleri kategoriye bağlı olduğu için önce kategori
  //  seçilsin (bkz. kullanıcı geri bildirimi). Katalog eşleşmesinde önden dolar.
  const [categorySlug, setCategorySlug] = useState<CategoryKey | "">(prefill.categorySlug);
  const [selectedMake, setSelectedMake]   = useState(prefill.selectedMake);
  const [customMake, setCustomMake]       = useState(prefill.customMake);
  const [selectedModel, setSelectedModel] = useState(prefill.selectedModel);
  const [customModel, setCustomModel]     = useState(prefill.customModel);
  const [selectedVersion, setSelectedVersion] = useState("");
  const [customVersion, setCustomVersion]     = useState("");
  const [selectedTrim, setSelectedTrim]   = useState("");
  const [customTrim, setCustomTrim]       = useState("");
  const [year, setYear]         = useState("");
  const [fuelType, setFuelType] = useState("");
  const [transmission, setTransmission] = useState("");
  const [notes, setNotes]       = useState(prefill.notes);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState<string | null>(null);

  // Katalogda zaten var mı? — marka + model seçilince kontrol edilir.
  const [existingMatches, setExistingMatches]   = useState<ExistingVehicleMatch[]>([]);
  const [checkingExisting, setCheckingExisting] = useState(false);
  const existingCardRef = useRef<HTMLDivElement>(null);

  // Otomobil/kamyonet: TSB tabanlı katalog (KatalogAracSecimi). Diğer kategoriler
  // henüz eski vehicles.json listesiyle çalışıyor.
  const katalogModu = categorySlug === "otomobil" || categorySlug === "kamyonet";
  const [katalogSecim, setKatalogSecim] = useState<KatalogSecimSonucu | null>(null);

  const makes      = categorySlug && !katalogModu ? vehiclesData[categorySlug] : [];
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

  // Marka + model katalogdan seçilince: bu araç zaten ACTIVE katalogda mı?
  // (setState yalnızca .then/.finally içinde — senkron effect-body setState yok.)
  const kontrolMarka = katalogModu ? katalogSecim?.brandName ?? "" : isOtherMake ? "" : selectedMake;
  const kontrolModel = katalogModu ? katalogSecim?.modelName ?? "" : isOtherModel ? "" : selectedModel;
  useEffect(() => {
    if (!kontrolMarka || !kontrolModel) return;
    let cancelled = false;
    const brand = kontrolMarka;
    const model = kontrolModel;
    const cat   = categorySlug;
    const t = setTimeout(() => {
      setCheckingExisting(true);
      const qs = new URLSearchParams({ brand, model });
      if (cat) qs.set("category", cat);
      fetch(`/api/oneriler/mevcut-mu?${qs.toString()}`)
        .then((r) => (r.ok ? r.json() : { matches: [] }))
        .then((d) => {
          if (!cancelled) setExistingMatches(Array.isArray(d.matches) ? d.matches : []);
        })
        .catch(() => { if (!cancelled) setExistingMatches([]); })
        .finally(() => { if (!cancelled) setCheckingExisting(false); });
    }, 300);
    return () => { cancelled = true; clearTimeout(t); };
  }, [kontrolMarka, kontrolModel, categorySlug]);

  function handleCategoryChange(val: string) {
    setCategorySlug(val as CategoryKey | "");
    setSelectedMake(""); setCustomMake("");
    setSelectedModel(""); setCustomModel("");
    setSelectedVersion(""); setCustomVersion("");
    setSelectedTrim(""); setCustomTrim("");
    setFuelType("");
    setTransmission("");
    setKatalogSecim(null);
    setExistingMatches([]);
  }

  function handleMakeChange(val: string) {
    setSelectedMake(val);
    setCustomMake("");
    setSelectedModel(""); setCustomModel("");
    setSelectedVersion(""); setCustomVersion("");
    setSelectedTrim(""); setCustomTrim("");
    setExistingMatches([]);
  }

  function handleModelChange(val: string) {
    setSelectedModel(val);
    setSelectedVersion(""); setCustomVersion("");
    setSelectedTrim(""); setCustomTrim("");
    setYear("");
    setExistingMatches([]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const brandName  = katalogModu ? katalogSecim?.brandName ?? "" : isOtherMake ? customMake.trim() : selectedMake;
    const modelName  = katalogModu ? katalogSecim?.modelName ?? "" : isOtherModel ? customModel.trim() : selectedModel;
    const versionFin = isOtherVersion ? customVersion.trim() : selectedVersion;
    const trimFin    = isOtherTrim    ? customTrim.trim()    : selectedTrim;

    if (!categorySlug) {
      setError("Lütfen araç tipini seçiniz.");
      return;
    }
    if (!brandName || !modelName) {
      setError("Lütfen marka ve model seçiniz.");
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      // Versiyon metnindeki HP/EV rakamları trimName'e girmez (bkz. parseVersion);
      // katalogdan seçildiyse HP ayrıca power_hp olarak gönderilir.
      const versionClean = versionForTrimName(versionFin, categorySlug);
      const powerHp = katalogModu
        ? katalogSecim?.powerHp ?? null
        : !isOtherVersion && selectedVersion ? parseVersion(selectedVersion, categorySlug).hp : null;
      const trimName = katalogModu
        ? katalogSecim?.trimName ?? ""
        : [versionClean, trimFin].filter(Boolean).join(" – ") || "";
      const gonder = katalogModu
        ? { year: katalogSecim?.year ?? "", fuelType: katalogSecim?.fuelType ?? "", transmission: katalogSecim?.transmission ?? "" }
        : { year, fuelType, transmission };
      const res = await fetch("/api/oneriler", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brandName, modelName, categorySlug, trimName, notes, powerHp, ...gonder }),
      });
      const text = await res.text();
      let data: Record<string, unknown> = {};
      try { data = text ? JSON.parse(text) : {}; } catch { throw new Error("Sunucu geçersiz yanıt döndürdü"); }

      if (res.status === 409 && data.existingSlug) {
        // Araç zaten aktif katalogda — sessizce yönlendirmek yerine kartı
        // göster, kullanıcı "yorum yaz" mı "yine de öner" mi seçsin.
        const fromServer: ExistingVehicleMatch[] =
          Array.isArray(data.matches) && data.matches.length > 0
            ? (data.matches as ExistingVehicleMatch[])
            : [{
                slug: String(data.existingSlug),
                name: typeof data.existingName === "string"
                  ? data.existingName
                  : `${brandName} ${modelName}`,
                year: null,
                trimName: null,
                transmission: null,
                reviewCount: typeof data.reviewCount === "number" ? data.reviewCount : 0,
              }];
        setExistingMatches(fromServer);
        setSubmitting(false);
        setError(null);
        requestAnimationFrame(() =>
          existingCardRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }),
        );
        return;
      }
      if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : "Bir hata oluştu");

      // Başarı — yorum formuna yönlendir
      router.push(`/yorum-yaz?arac=${data.slug}&yeni=1`);
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
      <div className="mb-6 px-4 py-3 rounded-xl bg-blue-50 border border-blue-100 text-sm text-blue-700 leading-relaxed space-y-1">
        <p>
          <span className="font-semibold">Önce{" "}
            <Link href="/araclar" className="underline hover:text-blue-900">araçlarda arayın</Link>
          </span>{" "}— aracınız zaten ekli olabilir.
        </p>
        <p>
          Eklediğiniz araç için sonrasında yorum da yazabilirsiniz — zorunlu değil. Moderatörümüz inceleyip onaylar.
        </p>
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
            <option value="">— Araç tipi seçin —</option>
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>

        {katalogModu && (
          <KatalogAracSecimi
            key={categorySlug}
            kategori={categorySlug}
            baslangicMarka={prefill.categorySlug === categorySlug ? prefill.selectedMake : ""}
            baslangicModel={prefill.categorySlug === categorySlug ? prefill.selectedModel : ""}
            baslangicOzelModel={prefill.categorySlug === categorySlug ? prefill.customModel : ""}
            onChange={setKatalogSecim}
          />
        )}

        {/* Marka */}
        {!katalogModu && (
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
        )}

        {/* Model */}
        {!katalogModu && selectedMake && (
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
            {checkingExisting && existingMatches.length === 0 && (
              <p className="mt-1.5 text-xs text-gray-400">Katalogda var mı diye bakılıyor…</p>
            )}
          </div>
        )}

        {/* Bu araç zaten katalogda — yeniden eklemeye gerek yok */}
        {existingMatches.length > 0 && (
          <div ref={existingCardRef} className="rounded-2xl border border-green-200 bg-green-50 p-4 space-y-3">
            <div className="flex items-start gap-2.5">
              <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-green-600 shrink-0 mt-0.5" aria-hidden="true">
                <path d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z" stroke="currentColor" strokeWidth="1.6" />
                <path d="m8 12 2.5 2.5L16 9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-green-900">Bu araç zaten fikape&apos;de</p>
                <p className="text-xs text-green-700 mt-0.5">
                  Yeniden eklemenize gerek yok — mevcut araca yorum yazabilirsiniz.
                </p>
              </div>
            </div>
            <div className="space-y-1.5">
              {existingMatches.slice(0, 4).map((mm) => (
                <div
                  key={mm.slug}
                  className="flex items-center justify-between gap-2 rounded-xl bg-white border border-green-100 px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{mm.name}</p>
                    <p className="text-[11px] text-gray-400">
                      {mm.reviewCount > 0 ? `${mm.reviewCount} yorum` : "Henüz yorum yok"}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Link
                      href={`/araclar/${mm.slug}`}
                      className="text-xs font-medium text-gray-500 hover:text-gray-800 px-2 py-1"
                    >
                      Aç
                    </Link>
                    <Link
                      href={`/yorum-yaz?arac=${mm.slug}`}
                      className="text-xs font-semibold text-white rounded-lg px-3 py-1.5"
                      style={{ background: "#111" }}
                    >
                      Yorum yaz →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Versiyon */}
        {!katalogModu && selectedModel && !isOtherModel && versions.length > 0 && (
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
              {versions.map((v) => <option key={v} value={v}>{formatVersionLabel(v, categorySlug)}</option>)}
            </select>
            {isOtherVersion && (
              <input type="text" value={customVersion} onChange={(e) => setCustomVersion(e.target.value)}
                placeholder="Versiyon bilgisi yazınız"
                className="mt-2 w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gray-400" autoFocus />
            )}
          </div>
        )}

        {/* Donanım */}
        {!katalogModu && selectedModel && !isOtherModel && trims.length > 0 && (
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
        {!katalogModu && (
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
        )}

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

        {/* Katalogda eşleşme varsa "öner" birincil aksiyon olmaktan çıkar —
            kullanıcı kartdan yorum yazmaya yönlensin; yine de farklı bir
            nesil/varyant önermek isteyebilir. */}
        <button
          type="submit"
          disabled={submitting}
          className={`w-full py-3 rounded-xl text-sm font-bold transition-opacity disabled:opacity-60 ${
            existingMatches.length > 0
              ? "border border-gray-300 text-gray-600 hover:bg-gray-50"
              : "text-white"
          }`}
          style={existingMatches.length > 0 ? undefined : { background: "#111" }}
        >
          {submitting
            ? "Oluşturuluyor..."
            : existingMatches.length > 0
              ? "Yine de farklı bir nesil/varyant öner"
              : "Aracı Öner"}
        </button>

        <p className="text-center text-xs text-gray-400">
          Araç eklendikten sonra dilerseniz deneyiminizi de paylaşabilirsiniz — yorum yazmak zorunlu değil.
        </p>
      </form>
    </div>
  );
}
