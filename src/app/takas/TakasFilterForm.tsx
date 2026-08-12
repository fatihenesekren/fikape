"use client";

import { useState } from "react";

const PAYMENT_OPTIONS = [
  { value: "SWAP_ONLY", label: "Sadece takas (yakın değer)" },
  { value: "PAYS_EXTRA", label: "Üstüne para verir" },
  { value: "WANTS_EXTRA", label: "Üstüne para bekliyor" },
];

export function TakasFilterForm({
  il,
  kategoriSlug,
  markaSlug,
  odemeNiyeti,
  cities,
  categories,
  brands,
  categoryBrandMap,
}: {
  il: string;
  kategoriSlug: string;
  markaSlug: string;
  odemeNiyeti: string;
  cities: readonly string[];
  categories: { id: number; slug: string; name: string }[];
  brands: { id: number; slug: string; name: string }[];
  categoryBrandMap: Record<string, string[]>;
}) {
  const [kategori, setKategori] = useState(kategoriSlug);
  const availableBrands = kategori ? brands.filter((b) => categoryBrandMap[kategori]?.includes(b.slug)) : brands;

  return (
    <form method="get" className="grid grid-cols-1 sm:grid-cols-4 gap-2 mb-8">
      <select name="il" defaultValue={il} aria-label="İl" className="text-sm rounded-lg border border-gray-200 px-2.5 py-1.5">
        <option value="">İl seçiniz</option>
        {cities.map((c) => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>
      <select
        name="kategori"
        value={kategori}
        onChange={(e) => setKategori(e.target.value)}
        aria-label="Kategori"
        className="text-sm rounded-lg border border-gray-200 px-2.5 py-1.5"
      >
        <option value="">Tüm kategoriler</option>
        {categories.map((c) => (
          <option key={c.id} value={c.slug}>{c.name}</option>
        ))}
      </select>
      <select
        name="marka"
        defaultValue={markaSlug}
        disabled={!kategori}
        aria-label="Marka"
        className="text-sm rounded-lg border border-gray-200 px-2.5 py-1.5 disabled:opacity-50"
      >
        <option value="">{kategori ? "Tüm markalar" : "Önce kategori seçiniz"}</option>
        {availableBrands.map((b) => (
          <option key={b.id} value={b.slug}>{b.name}</option>
        ))}
      </select>
      <select name="odeme" defaultValue={odemeNiyeti} aria-label="Ödeme niyeti" className="text-sm rounded-lg border border-gray-200 px-2.5 py-1.5">
        <option value="">Ödeme niyeti (tümü)</option>
        {PAYMENT_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <button type="submit" className="sm:col-span-4 text-sm font-semibold text-white rounded-lg px-3 py-1.5" style={{ background: "#4338ca" }}>
        Filtrele
      </button>
    </form>
  );
}
