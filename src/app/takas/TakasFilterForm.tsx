"use client";

import { useState } from "react";
import Link from "next/link";

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
  yilMin,
  yilMax,
  kmMin,
  kmMax,
  cities,
  categories,
  brands,
  categoryBrandMap,
}: {
  il: string;
  kategoriSlug: string;
  markaSlug: string;
  odemeNiyeti: string;
  yilMin: string;
  yilMax: string;
  kmMin: string;
  kmMax: string;
  cities: readonly string[];
  categories: { id: number; slug: string; name: string }[];
  brands: { id: number; slug: string; name: string }[];
  categoryBrandMap: Record<string, string[]>;
}) {
  const [kategori, setKategori] = useState(kategoriSlug);
  const availableBrands = kategori ? brands.filter((b) => categoryBrandMap[kategori]?.includes(b.slug)) : brands;
  // Filtreleri temizleme — önceden hiç yoktu, kullanıcı bir filtre uyguladıktan
  // sonra geri dönmenin tek yolu URL'yi elle temizlemekti (bkz. kullanıcı geri
  // bildirimi, ekran görüntüsü).
  const hasActiveFilters = !!(il || kategoriSlug || markaSlug || odemeNiyeti || yilMin || yilMax || kmMin || kmMax);

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
      <input
        type="number"
        name="yilMin"
        defaultValue={yilMin}
        placeholder="Yıl (min)"
        min={1980}
        max={2100}
        aria-label="En eski model yılı"
        className="text-sm rounded-lg border border-gray-200 px-2.5 py-1.5"
      />
      <input
        type="number"
        name="yilMax"
        defaultValue={yilMax}
        placeholder="Yıl (max)"
        min={1980}
        max={2100}
        aria-label="En yeni model yılı"
        className="text-sm rounded-lg border border-gray-200 px-2.5 py-1.5"
      />
      <input
        type="number"
        name="kmMin"
        defaultValue={kmMin}
        placeholder="Km (en az)"
        min={0}
        aria-label="En az kilometre"
        className="text-sm rounded-lg border border-gray-200 px-2.5 py-1.5"
      />
      <input
        type="number"
        name="kmMax"
        defaultValue={kmMax}
        placeholder="Km (en fazla)"
        min={0}
        aria-label="En fazla kilometre"
        className="text-sm rounded-lg border border-gray-200 px-2.5 py-1.5"
      />
      <div className="sm:col-span-4 flex items-center gap-3">
        <button type="submit" className="flex-1 text-sm font-semibold text-white rounded-lg px-3 py-1.5" style={{ background: "#4338ca" }}>
          Filtrele
        </button>
        {hasActiveFilters && (
          <Link href="/takas" className="text-xs font-semibold text-gray-500 hover:text-gray-800 hover:underline whitespace-nowrap">
            Filtreleri Temizle
          </Link>
        )}
      </div>
    </form>
  );
}
