"use client";

import { useState } from "react";

export function TakasFilterForm({
  il,
  kategoriSlug,
  markaSlug,
  cities,
  categories,
  brands,
  categoryBrandMap,
}: {
  il: string;
  kategoriSlug: string;
  markaSlug: string;
  cities: readonly string[];
  categories: { id: number; slug: string; name: string }[];
  brands: { id: number; slug: string; name: string }[];
  categoryBrandMap: Record<string, string[]>;
}) {
  const [kategori, setKategori] = useState(kategoriSlug);
  const availableBrands = kategori ? brands.filter((b) => categoryBrandMap[kategori]?.includes(b.slug)) : brands;

  return (
    <form method="get" className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-8">
      <select name="il" defaultValue={il} className="text-sm rounded-lg border border-gray-200 px-2.5 py-1.5">
        <option value="">İl seçiniz</option>
        {cities.map((c) => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>
      <select
        name="kategori"
        value={kategori}
        onChange={(e) => setKategori(e.target.value)}
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
        className="text-sm rounded-lg border border-gray-200 px-2.5 py-1.5 disabled:opacity-50"
      >
        <option value="">{kategori ? "Tüm markalar" : "Önce kategori seçiniz"}</option>
        {availableBrands.map((b) => (
          <option key={b.id} value={b.slug}>{b.name}</option>
        ))}
      </select>
      <button type="submit" className="sm:col-span-3 text-sm font-semibold text-white rounded-lg px-3 py-1.5" style={{ background: "#4338ca" }}>
        Filtrele
      </button>
    </form>
  );
}
