"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";

const CATEGORIES = [
  { value: "otomobil", label: "Otomobil" },
  { value: "motosiklet", label: "Motosiklet" },
  { value: "e-scooter", label: "E-Scooter" },
  { value: "karavan", label: "Karavan" },
  { value: "kamyonet", label: "Kamyonet" },
] as const;

const FUEL_TYPES: Record<string, { value: string; label: string }[]> = {
  otomobil: [
    { value: "GASOLINE", label: "Benzin" },
    { value: "DIESEL", label: "Dizel" },
    { value: "EV", label: "Elektrikli (EV)" },
    { value: "PHEV", label: "Plug-in Hibrit (PHEV)" },
    { value: "HYBRID", label: "Hibrit" },
    { value: "LPG", label: "LPG" },
  ],
  motosiklet: [
    { value: "GASOLINE", label: "Benzin" },
    { value: "EV", label: "Elektrikli" },
  ],
  kamyonet: [
    { value: "GASOLINE", label: "Benzin" },
    { value: "DIESEL", label: "Dizel" },
    { value: "EV", label: "Elektrikli" },
  ],
};

const YEARS = Array.from({ length: 2025 - 2000 + 1 }, (_, i) => 2025 - i);

export default function OnerPage() {
  const { data: session, status } = useSession();
  const [form, setForm] = useState({
    brandName: "",
    modelName: "",
    year: "",
    categorySlug: "otomobil",
    fuelType: "",
    trimName: "",
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (status === "loading") {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center text-sm text-gray-400">
        Yükleniyor...
      </div>
    );
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
            <Link
              href="/giris?callbackUrl=/oner"
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white text-center transition-colors"
              style={{ background: "#111" }}
            >
              Giriş yap
            </Link>
            <Link
              href="/kayit"
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-gray-700 text-center border border-gray-200 hover:bg-gray-50 transition-colors"
            >
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
          {form.brandName} {form.modelName} önerinizi inceleyeceğiz. Onaylandığında araç listesine eklenecek.
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => {
              setDone(false);
              setForm({ brandName: "", modelName: "", year: "", categorySlug: "otomobil", fuelType: "", trimName: "", notes: "" });
            }}
            className="px-4 py-2 rounded-xl text-sm font-semibold border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Yeni Öneri
          </button>
          <Link
            href="/"
            className="px-4 py-2 rounded-xl text-sm font-semibold text-white transition-colors"
            style={{ background: "#111" }}
          >
            Ana Sayfa
          </Link>
        </div>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/oneriler", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Bir hata oluştu");
      }
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bir hata oluştu");
    } finally {
      setSubmitting(false);
    }
  }

  const fuelOptions = FUEL_TYPES[form.categorySlug] ?? [];

  return (
    <div className="max-w-xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-gray-900 mb-1">Araç Öner</h1>
        <p className="text-sm text-gray-500">
          Listede olmayan bir aracı önerin, ekibimiz inceleleyip kataloğa eklesin.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Marka & Model */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Marka <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={form.brandName}
              onChange={(e) => setForm({ ...form, brandName: e.target.value })}
              placeholder="ör. Toyota"
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gray-400 transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Model <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={form.modelName}
              onChange={(e) => setForm({ ...form, modelName: e.target.value })}
              placeholder="ör. Corolla"
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gray-400 transition-colors"
            />
          </div>
        </div>

        {/* Kategori */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            Araç Tipi <span className="text-red-500">*</span>
          </label>
          <select
            value={form.categorySlug}
            onChange={(e) => setForm({ ...form, categorySlug: e.target.value, fuelType: "" })}
            className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gray-400 transition-colors bg-white"
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>

        {/* Yıl & Yakıt */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Yıl</label>
            <select
              value={form.year}
              onChange={(e) => setForm({ ...form, year: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gray-400 transition-colors bg-white"
            >
              <option value="">— Seçin —</option>
              {YEARS.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          {fuelOptions.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Yakıt Tipi</label>
              <select
                value={form.fuelType}
                onChange={(e) => setForm({ ...form, fuelType: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gray-400 transition-colors bg-white"
              >
                <option value="">— Seçin —</option>
                {fuelOptions.map((f) => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Versiyon / Trim */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            Versiyon / Donanım <span className="text-gray-400 font-normal">(opsiyonel)</span>
          </label>
          <input
            type="text"
            value={form.trimName}
            onChange={(e) => setForm({ ...form, trimName: e.target.value })}
            placeholder="ör. Comfort, GR Sport, Long Range"
            className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gray-400 transition-colors"
          />
        </div>

        {/* Not */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            Ek Bilgi <span className="text-gray-400 font-normal">(opsiyonel)</span>
          </label>
          <textarea
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            maxLength={500}
            rows={3}
            placeholder="Araç hakkında eklemek istediğiniz bilgiler..."
            className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gray-400 transition-colors resize-none"
          />
          <p className="text-right text-xs text-gray-400 mt-0.5">{form.notes.length}/500</p>
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
          {submitting ? "Gönderiliyor..." : "Öneriyi Gönder"}
        </button>

        <p className="text-center text-xs text-gray-400">
          Öneriler yöneticiler tarafından incelendikten sonra eklenir.
        </p>
      </form>
    </div>
  );
}
