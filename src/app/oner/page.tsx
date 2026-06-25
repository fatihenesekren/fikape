"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";

const CATEGORIES = [
  { value: "otomobil",   label: "Otomobil" },
  { value: "motosiklet", label: "Motosiklet" },
  { value: "e-scooter",  label: "E-Scooter" },
  { value: "karavan",    label: "Karavan" },
  { value: "kamyonet",   label: "Kamyonet" },
] as const;

// CarQuery kullanan kategoriler
const CQ_CATEGORIES = new Set(["otomobil", "motosiklet", "kamyonet"]);

// Statik marka listeleri
const STATIC_BRANDS: Record<string, string[]> = {
  "e-scooter": [
    "Xiaomi", "Segway", "Ninebot", "Kaabo", "Dualtron", "Niu", "Inokim",
    "Vsett", "Kugoo", "Zero", "Pure Electric", "Levy", "Turboant", "Gotrax",
    "Joyor", "Hiboy", "Apollo", "Emove", "Fluid", "Unagi", "Bird", "Lime",
    "Navee", "Cecotec", "Laotie",
  ].sort(),
  karavan: [
    "Adria", "Bailey", "Bürstner", "Caravelair", "Coachman", "Dethleffs",
    "Elnagh", "Eriba", "Eura Mobil", "Fendt", "Fleurette", "Frankia",
    "Globecar", "Hobby", "Hymer", "Knaus", "LMC", "Laika", "Mc Louis",
    "Niesmann+Bischoff", "Pilote", "Rapido", "Rime", "Roller Team",
    "Sunlight", "Swift", "Tabbert", "Trigano", "Weinsberg",
  ].sort(),
};

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
  ],
};

const YEARS = Array.from({ length: 2026 - 1990 + 1 }, (_, i) => 2026 - i);

const SCORE_LABELS: Record<number, string> = {
  1: "Çok kötü", 2: "Kötü", 3: "Orta", 4: "İyi", 5: "Çok iyi",
};

type Make = { make_id: string; make_display: string };
type CarModel = { model_name: string };

export default function OnerPage() {
  const { data: session, status } = useSession();

  // ── Kategori ──
  const [categorySlug, setCategorySlug] = useState("otomobil");
  const useCarQuery = CQ_CATEGORIES.has(categorySlug);

  // ── CarQuery state (otomobil / moto / kamyonet) ──
  const [allMakes, setAllMakes] = useState<Make[]>([]);
  const [makesLoading, setMakesLoading] = useState(false);
  const [brandInput, setBrandInput] = useState("");
  const [selectedMake, setSelectedMake] = useState<Make | null>(null);
  const [showMakes, setShowMakes] = useState(false);

  const [models, setModels] = useState<CarModel[]>([]);
  const [modelsLoading, setModelsLoading] = useState(false);
  const [modelInput, setModelInput] = useState("");
  const [selectedModel, setSelectedModel] = useState<CarModel | null>(null);
  const [showModels, setShowModels] = useState(false);

  // ── Statik marka state (e-scooter / karavan) ──
  const [staticBrand, setStaticBrand] = useState("");
  const [staticModel, setStaticModel] = useState("");

  // ── Ortak alanlar ──
  const [year, setYear] = useState("");
  const [fuelType, setFuelType] = useState("");
  const [trimName, setTrimName] = useState("");
  const [notes, setNotes] = useState("");

  // ── Yorum ──
  const [addReview, setAddReview] = useState(false);
  const [scoreFiyat, setScoreFiyat] = useState(0);
  const [scoreKalite, setScoreKalite] = useState(0);
  const [scorePerformans, setScorePerformans] = useState(0);
  const [summaryText, setSummaryText] = useState("");

  // ── Fotoğraf ──
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // ── Genel ──
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Tüm markaları mount'ta bir kez yükle
  useEffect(() => {
    if (allMakes.length > 0) return;
    setMakesLoading(true);
    fetch("/api/carquery/makes")
      .then((r) => r.json())
      .then((d) => setAllMakes(d.makes ?? []))
      .finally(() => setMakesLoading(false));
  }, [allMakes.length]);

  // Marka seçilince modelleri yükle (CarQuery)
  useEffect(() => {
    if (!selectedMake) { setModels([]); return; }
    setModelsLoading(true);
    fetch(`/api/carquery/models?make=${encodeURIComponent(selectedMake.make_id)}`)
      .then((r) => r.json())
      .then((d) => setModels(d.models ?? []))
      .finally(() => setModelsLoading(false));
  }, [selectedMake]);

  // Kategori değişince alanları sıfırla
  function handleCategoryChange(val: string) {
    setCategorySlug(val);
    setFuelType("");
    setBrandInput(""); setSelectedMake(null);
    setModelInput(""); setSelectedModel(null);
    setStaticBrand(""); setStaticModel("");
    setModels([]);
  }

  // Marka client-side filtrele
  const filteredMakes = brandInput.length >= 1
    ? allMakes.filter((m) => m.make_display.toLowerCase().startsWith(brandInput.toLowerCase())).slice(0, 20)
    : [];

  // Model client-side filtrele
  const filteredModels = modelInput
    ? models.filter((m) => m.model_name.toLowerCase().includes(modelInput.toLowerCase()))
    : models;

  function selectMake(make: Make) {
    setSelectedMake(make);
    setBrandInput(make.make_display);
    setShowMakes(false);
    setSelectedModel(null);
    setModelInput("");
  }

  function selectModel(model: CarModel) {
    setSelectedModel(model);
    setModelInput(model.model_name);
    setShowModels(false);
  }

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []).slice(0, 5 - photos.length);
    if (!files.length) return;
    setPhotos((prev) => [...prev, ...files]);
    setUploadingPhotos(true);
    try {
      const uploaded: string[] = [];
      for (const file of files) {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch("/api/uploads/suggestion-photo", { method: "POST", body: fd });
        if (res.ok) {
          const { url } = await res.json();
          uploaded.push(url);
        }
      }
      setPhotoUrls((prev) => [...prev, ...uploaded]);
    } finally {
      setUploadingPhotos(false);
    }
  }

  function removePhoto(idx: number) {
    setPhotos((prev) => prev.filter((_, i) => i !== idx));
    setPhotoUrls((prev) => prev.filter((_, i) => i !== idx));
  }

  function resetForm() {
    setBrandInput(""); setSelectedMake(null);
    setModelInput(""); setSelectedModel(null);
    setStaticBrand(""); setStaticModel("");
    setYear(""); setFuelType(""); setTrimName(""); setNotes("");
    setAddReview(false); setScoreFiyat(0); setScoreKalite(0); setScorePerformans(0); setSummaryText("");
    setPhotos([]); setPhotoUrls([]);
    setDone(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const brandName = useCarQuery ? selectedMake?.make_display : staticBrand;
    const modelName = useCarQuery ? selectedModel?.model_name : staticModel;

    if (!brandName || !modelName?.trim()) {
      setError("Lütfen marka ve model girin.");
      return;
    }
    if (useCarQuery && !selectedMake) {
      setError("Lütfen listeden bir marka seçin.");
      return;
    }
    if (addReview && (!scoreFiyat || !scoreKalite || !scorePerformans)) {
      setError("Yorum eklemek için tüm puanları doldur.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const body = {
        brandName,
        modelName: modelName.trim(),
        year,
        categorySlug,
        fuelType,
        trimName,
        notes,
        carQueryData: useCarQuery && selectedMake
          ? { make_id: selectedMake.make_id, make_display: selectedMake.make_display, model_name: selectedModel?.model_name }
          : null,
        reviewData: addReview ? { scoreFiyat, scoreKalite, scorePerformans, summaryText } : null,
        photoUrls,
      };
      const res = await fetch("/api/oneriler", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? "Bir hata oluştu");
      }
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bir hata oluştu");
    } finally {
      setSubmitting(false);
    }
  }

  // ── Auth gate ──
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
            Listede olmayan bir aracı önerin, ekibimiz inceleyip kataloğa eklesin.
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

  if (done) {
    const brandName = useCarQuery ? selectedMake?.make_display : staticBrand;
    const modelName = useCarQuery ? selectedModel?.model_name : staticModel;
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <p className="text-5xl mb-4">✅</p>
        <h1 className="text-xl font-bold text-gray-900 mb-2">Öneriniz Alındı!</h1>
        <p className="text-sm text-gray-500 mb-6">
          {brandName} {modelName} önerinizi inceleyeceğiz. Onaylandığında size bildirim gönderilecek.
        </p>
        <div className="flex items-center justify-center gap-3">
          <button onClick={resetForm} className="px-4 py-2 rounded-xl text-sm font-semibold border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors">
            Yeni Öneri
          </button>
          <Link href="/" className="px-4 py-2 rounded-xl text-sm font-semibold text-white" style={{ background: "#111" }}>
            Ana Sayfa
          </Link>
        </div>
      </div>
    );
  }

  const fuelOptions = FUEL_TYPES[categorySlug] ?? [];
  const staticBrands = STATIC_BRANDS[categorySlug] ?? [];

  return (
    <div className="max-w-[480px] mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-gray-900 mb-1">Araç Öner</h1>
        <p className="text-sm text-gray-500">Listede olmayan bir aracı önerin, ekibimiz inceleyip kataloğa eklesin.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* ── Kategori (önce seç) ── */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            Araç Tipi <span className="text-red-500">*</span>
          </label>
          <select
            value={categorySlug}
            onChange={(e) => handleCategoryChange(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gray-400 transition-colors bg-white"
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>

        {/* ── Marka ── */}
        {useCarQuery ? (
          <div className="relative">
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Marka <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={brandInput}
              onChange={(e) => {
                setBrandInput(e.target.value);
                setSelectedMake(null);
                setSelectedModel(null);
                setModelInput("");
                setShowMakes(true);
              }}
              onFocus={() => { if (filteredMakes.length) setShowMakes(true); }}
              onBlur={() => setTimeout(() => setShowMakes(false), 150)}
              placeholder={makesLoading ? "Yükleniyor..." : "ör. Toyota, BMW, Renault..."}
              disabled={makesLoading}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gray-400 transition-colors disabled:bg-gray-50 disabled:text-gray-400"
            />
            {showMakes && filteredMakes.length > 0 && (
              <ul className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                {filteredMakes.map((m) => (
                  <li
                    key={m.make_id}
                    onMouseDown={() => selectMake(m)}
                    className="px-3 py-2 text-sm hover:bg-gray-50 cursor-pointer"
                  >
                    {m.make_display}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : (
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Marka <span className="text-red-500">*</span>
            </label>
            <select
              value={staticBrand}
              onChange={(e) => setStaticBrand(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gray-400 transition-colors bg-white"
            >
              <option value="">— Marka seçin —</option>
              {staticBrands.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
              <option value="__diger__">Listede yok (diğer)</option>
            </select>
            {staticBrand === "__diger__" && (
              <input
                type="text"
                placeholder="Marka adını yazın"
                className="mt-2 w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gray-400 transition-colors"
                onChange={(e) => setStaticBrand(e.target.value)}
              />
            )}
          </div>
        )}

        {/* ── Model ── */}
        {useCarQuery ? (
          <div className="relative">
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Model <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={modelInput}
              onChange={(e) => {
                setModelInput(e.target.value);
                setSelectedModel(null);
                setShowModels(true);
              }}
              onFocus={() => { if (models.length) setShowModels(true); }}
              onBlur={() => setTimeout(() => setShowModels(false), 150)}
              placeholder={selectedMake ? (modelsLoading ? "Yükleniyor..." : "Model seçin veya yazın") : "Önce marka seçin"}
              disabled={!selectedMake || modelsLoading}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gray-400 transition-colors disabled:bg-gray-50 disabled:text-gray-400"
            />
            {showModels && filteredModels.length > 0 && (
              <ul className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                {filteredModels.map((m) => (
                  <li
                    key={m.model_name}
                    onMouseDown={() => selectModel(m)}
                    className="px-3 py-2 text-sm hover:bg-gray-50 cursor-pointer"
                  >
                    {m.model_name}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : (
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Model <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={staticModel}
              onChange={(e) => setStaticModel(e.target.value)}
              placeholder="ör. Mi 4 Pro, Travelstar 700..."
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gray-400 transition-colors"
            />
          </div>
        )}

        {/* ── Yıl & Yakıt ── */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Yıl</label>
            <select
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gray-400 transition-colors bg-white"
            >
              <option value="">— Seçin —</option>
              {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          {fuelOptions.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Yakıt Tipi</label>
              <select
                value={fuelType}
                onChange={(e) => setFuelType(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gray-400 transition-colors bg-white"
              >
                <option value="">— Seçin —</option>
                {fuelOptions.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
              </select>
            </div>
          )}
        </div>

        {/* ── Versiyon ── */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            Versiyon / Donanım <span className="text-gray-400 font-normal">(opsiyonel)</span>
          </label>
          <input
            type="text"
            value={trimName}
            onChange={(e) => setTrimName(e.target.value)}
            placeholder="ör. Comfort, GR Sport, Long Range"
            className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gray-400 transition-colors"
          />
        </div>

        {/* ── Not ── */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            Ek Bilgi <span className="text-gray-400 font-normal">(opsiyonel)</span>
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            maxLength={500}
            rows={2}
            placeholder="Araç hakkında eklemek istediğiniz bilgiler..."
            className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gray-400 transition-colors resize-none"
          />
          <p className="text-right text-xs text-gray-400 mt-0.5">{notes.length}/500</p>
        </div>

        {/* ── Yorum toggle ── */}
        <div className="border-t border-gray-100 pt-5">
          <button
            type="button"
            onClick={() => setAddReview(!addReview)}
            className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-gray-900 transition-colors"
          >
            <span className={`w-5 h-5 rounded flex items-center justify-center border text-xs transition-colors ${addReview ? "bg-gray-900 border-gray-900 text-white" : "border-gray-300"}`}>
              {addReview && "✓"}
            </span>
            Bu araç hakkında yorum da eklemek istiyorum
          </button>
        </div>

        {addReview && (
          <div className="bg-gray-50 rounded-2xl p-4 space-y-4">
            {[
              { key: "fi", label: "Fiyat (FI)", value: scoreFiyat, set: setScoreFiyat },
              { key: "ka", label: "Kalite (KA)", value: scoreKalite, set: setScoreKalite },
              { key: "pe", label: "Performans (PE)", value: scorePerformans, set: setScorePerformans },
            ].map(({ key, label, value, set }) => (
              <div key={key}>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-semibold text-gray-700">{label}</label>
                  {value > 0 && <span className="text-xs text-gray-500">{SCORE_LABELS[value]}</span>}
                </div>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => set(n)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${value === n ? "bg-gray-900 text-white border-gray-900" : "border-gray-200 text-gray-500 hover:border-gray-400"}`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            ))}

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Yorumun <span className="text-red-500">*</span>
              </label>
              <textarea
                value={summaryText}
                onChange={(e) => setSummaryText(e.target.value)}
                maxLength={500}
                rows={3}
                placeholder="Bu araçla ilgili deneyimini kısaca anlat..."
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gray-400 transition-colors resize-none bg-white"
              />
              <p className="text-right text-xs text-gray-400 mt-0.5">{summaryText.length}/500</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2">
                Araç Fotoğrafları <span className="text-gray-400 font-normal">(opsiyonel, maks. 5)</span>
              </label>
              {photos.length > 0 && (
                <div className="flex gap-2 flex-wrap mb-2">
                  {photos.map((f, i) => (
                    <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden border border-gray-200">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={URL.createObjectURL(f)} alt="" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removePhoto(i)}
                        className="absolute top-0.5 right-0.5 w-4 h-4 bg-black/60 rounded-full text-white text-xs flex items-center justify-center"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {photos.length < 5 && (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploadingPhotos}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl border border-dashed border-gray-300 text-xs text-gray-500 hover:border-gray-400 hover:text-gray-700 transition-colors disabled:opacity-50"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                  {uploadingPhotos ? "Yükleniyor..." : "Fotoğraf Ekle"}
                </button>
              )}
              <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handlePhotoChange} />
            </div>
          </div>
        )}

        {error && (
          <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-sm text-red-600">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting || uploadingPhotos}
          className="w-full py-3 rounded-xl text-sm font-bold text-white transition-opacity disabled:opacity-60"
          style={{ background: "#111" }}
        >
          {submitting ? "Gönderiliyor..." : "Öneriyi Gönder"}
        </button>

        <p className="text-center text-xs text-gray-400">
          Öneriler yöneticiler tarafından incelendikten sonra eklenir.
        </p>
      </form>
    </div>
  );
}
