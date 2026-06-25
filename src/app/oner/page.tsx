"use client";

import { useState, useRef } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import vehiclesData from "@/data/vehicles.json";

const CATEGORIES = [
  { value: "otomobil",   label: "Otomobil" },
  { value: "motosiklet", label: "Motosiklet" },
  { value: "e-scooter",  label: "E-Scooter" },
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
  ],
};

const YEARS = Array.from({ length: 2026 - 1990 + 1 }, (_, i) => 2026 - i);

const SCORE_LABELS: Record<number, string> = {
  1: "Çok kötü", 2: "Kötü", 3: "Orta", 4: "İyi", 5: "Çok iyi",
};

type CategoryKey = keyof typeof vehiclesData;

export default function OnerPage() {
  const { data: session, status } = useSession();

  const [categorySlug, setCategorySlug] = useState<CategoryKey>("otomobil");
  const [selectedMake, setSelectedMake] = useState("");
  const [selectedModel, setSelectedModel] = useState("");
  const [customModel, setCustomModel] = useState("");

  const [year, setYear] = useState("");
  const [fuelType, setFuelType] = useState("");
  const [trimName, setTrimName] = useState("");
  const [notes, setNotes] = useState("");

  const [addReview, setAddReview] = useState(false);
  const [scoreFiyat, setScoreFiyat] = useState(0);
  const [scoreKalite, setScoreKalite] = useState(0);
  const [scorePerformans, setScorePerformans] = useState(0);
  const [summaryText, setSummaryText] = useState("");

  const [photos, setPhotos] = useState<File[]>([]);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const makes = vehiclesData[categorySlug] ?? [];
  const makeEntry = makes.find((m) => m.make === selectedMake);
  const models = makeEntry?.models ?? [];

  const isOther = selectedModel === "Diğer";

  function handleCategoryChange(val: string) {
    setCategorySlug(val as CategoryKey);
    setSelectedMake("");
    setSelectedModel("");
    setCustomModel("");
    setFuelType("");
  }

  function handleMakeChange(val: string) {
    setSelectedMake(val);
    setSelectedModel("");
    setCustomModel("");
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
    setSelectedMake(""); setSelectedModel(""); setCustomModel("");
    setYear(""); setFuelType(""); setTrimName(""); setNotes("");
    setAddReview(false); setScoreFiyat(0); setScoreKalite(0); setScorePerformans(0); setSummaryText("");
    setPhotos([]); setPhotoUrls([]);
    setDone(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const brandName = selectedMake === "Diğer / Bulamadım" ? customModel : selectedMake;
    const modelName = isOther ? customModel.trim() : selectedModel;

    if (!brandName || !modelName) {
      setError("Lütfen marka ve model seçin.");
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
        modelName,
        year,
        categorySlug,
        fuelType,
        trimName,
        notes,
        carQueryData: null,
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
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <p className="text-5xl mb-4">✅</p>
        <h1 className="text-xl font-bold text-gray-900 mb-2">Öneriniz Alındı!</h1>
        <p className="text-sm text-gray-500 mb-6">
          {selectedMake} {isOther ? customModel : selectedModel} önerinizi inceleyeceğiz.
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

  return (
    <div className="max-w-[480px] mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-gray-900 mb-1">Araç Öner</h1>
        <p className="text-sm text-gray-500">Listede olmayan bir aracı önerin, ekibimiz inceleyip kataloğa eklesin.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* ── Araç Tipi ── */}
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
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            Marka <span className="text-red-500">*</span>
          </label>
          <select
            value={selectedMake}
            onChange={(e) => handleMakeChange(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gray-400 transition-colors bg-white"
          >
            <option value="">— Marka seçin —</option>
            {makes.map((m) => (
              <option key={m.make} value={m.make}>{m.make}</option>
            ))}
          </select>
        </div>

        {/* ── Model ── */}
        {selectedMake && (
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Model <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedModel}
              onChange={(e) => { setSelectedModel(e.target.value); setCustomModel(""); }}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gray-400 transition-colors bg-white"
            >
              <option value="">— Model seçin —</option>
              {models.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
            {isOther && (
              <input
                type="text"
                value={customModel}
                onChange={(e) => setCustomModel(e.target.value)}
                placeholder="Model adını yazın"
                className="mt-2 w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gray-400 transition-colors"
                autoFocus
              />
            )}
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
