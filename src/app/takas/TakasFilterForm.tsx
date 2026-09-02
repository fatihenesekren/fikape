"use client";

import { useState } from "react";
import Link from "next/link";

const PAYMENT_OPTIONS = [
  { value: "SWAP_ONLY", label: "Sadece takas (yakın değer)" },
  { value: "PAYS_EXTRA", label: "Üstüne para verir" },
  { value: "WANTS_EXTRA", label: "Üstüne para bekliyor" },
];

// Product.attributes.fuel_type / transmission ile aynı sözlük (bkz.
// tradeExpectations.ts TRADE_FUEL_TYPES / TRANSMISSION_OPTIONS).
const FUEL_OPTIONS = [
  { value: "GASOLINE", label: "Benzin" },
  { value: "DIESEL", label: "Dizel" },
  { value: "EV", label: "Elektrikli" },
  { value: "PHEV", label: "Plug-in Hibrit" },
  { value: "HYBRID", label: "Hibrit" },
  { value: "LPG", label: "LPG" },
];
const TRANSMISSION_OPTIONS = ["Manuel", "Otomatik", "CVT", "Yarı Otomatik"];

export function TakasFilterForm({
  il,
  kategoriSlug,
  markaSlug,
  odemeNiyeti,
  yilMin,
  yilMax,
  kmMin,
  kmMax,
  yakit,
  vites,
  q,
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
  yakit: string;
  vites: string;
  q: string;
  cities: readonly string[];
  categories: { id: number; slug: string; name: string }[];
  brands: { id: number; slug: string; name: string }[];
  categoryBrandMap: Record<string, string[]>;
}) {
  const [kategori, setKategori] = useState(kategoriSlug);
  const availableBrands = kategori ? brands.filter((b) => categoryBrandMap[kategori]?.includes(b.slug)) : brands;
  // Hızlı Arama (serbest metin) ve Detaylı Arama (il/kategori/marka/ödeme/yıl/
  // km/yakıt/vites) görsel olarak ayrıldı ama aynı <form>/query string'i
  // paylaşıyorlar — ikisi de uygulanmışsa AND ile birleşiyor (kullanıcı onayı:
  // "birlikte çalışsın"). Detaylı Arama paneli, içinde aktif filtre varsa
  // varsayılan açık geliyor (bkz. 5 uzman ajan oylaması — kullanıcı sayfaya
  // döndüğünde ne uygulandığını görsün), yoksa kapalı başlıyor.
  const activeDetailedFields = [il, kategoriSlug, markaSlug, odemeNiyeti, yilMin, yilMax, kmMin, kmMax, yakit, vites].filter(Boolean);
  const hasDetailedFilters = activeDetailedFields.length > 0;
  // Filtreleri temizleme — önceden hiç yoktu, kullanıcı bir filtre uyguladıktan
  // sonra geri dönmenin tek yolu URL'yi elle temizlemekti (bkz. kullanıcı geri
  // bildirimi, ekran görüntüsü).
  const hasActiveFilters = hasDetailedFilters || !!q;
  // Görsel gruplandırma — önceden 8 alan tek kalabalık grid'de karışıyordu,
  // hangisinin ne için olduğu ayırt edilemiyordu (bkz. 5 uzman ajan
  // değerlendirmesi). Aktif olan alan hafif accent kenarlıkla vurgulanıyor.
  const fieldClass = (active: boolean) =>
    `text-sm rounded-lg border px-2.5 py-1.5 ${active ? "border-indigo-300 bg-indigo-50/40" : "border-gray-200"}`;

  return (
    <form method="get" className="mb-8">
      <div className="mb-2">
        <label htmlFor="takas-q" className="block text-xs font-bold text-gray-500 mb-1">
          🔍 Hızlı Arama
        </label>
        <div className="flex gap-2">
          <input
            id="takas-q"
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Marka, model veya versiyon ara…"
            aria-label="Serbest metin arama"
            className="flex-1 text-sm rounded-lg border border-gray-200 px-2.5 py-1.5"
          />
          <button type="submit" className="text-sm font-semibold text-white rounded-lg px-4 py-1.5 whitespace-nowrap" style={{ background: "#4338ca" }}>
            Ara
          </button>
        </div>
      </div>

      <details className="border border-gray-200 rounded-lg overflow-hidden" open={hasDetailedFilters}>
        <summary className="cursor-pointer select-none flex items-center justify-between text-xs font-bold text-gray-500 px-3 py-2.5">
          <span>🎛️ Detaylı Arama</span>
          {hasDetailedFilters && (
            <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full">
              {activeDetailedFields.length} filtre aktif
            </span>
          )}
        </summary>
        <div className="p-3 pt-1 space-y-3.5">
          <div>
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">📍 Konum ve Kategori</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <select name="il" defaultValue={il} aria-label="İl" className={fieldClass(!!il)}>
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
                className={fieldClass(!!kategoriSlug)}
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
                className={`${fieldClass(!!markaSlug)} disabled:opacity-50`}
              >
                <option value="">{kategori ? "Tüm markalar" : "Önce kategori seçiniz"}</option>
                {availableBrands.map((b) => (
                  <option key={b.id} value={b.slug}>{b.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">🚗 Araç Kriterleri</p>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                name="yilMin"
                defaultValue={yilMin}
                placeholder="Yıl (min)"
                min={1980}
                max={2100}
                aria-label="En eski model yılı"
                className={fieldClass(!!yilMin)}
              />
              <input
                type="number"
                name="yilMax"
                defaultValue={yilMax}
                placeholder="Yıl (max)"
                min={1980}
                max={2100}
                aria-label="En yeni model yılı"
                className={fieldClass(!!yilMax)}
              />
              <input
                type="number"
                name="kmMin"
                defaultValue={kmMin}
                placeholder="Km (en az)"
                min={0}
                aria-label="En az kilometre"
                className={fieldClass(!!kmMin)}
              />
              <input
                type="number"
                name="kmMax"
                defaultValue={kmMax}
                placeholder="Km (en fazla)"
                min={0}
                aria-label="En fazla kilometre"
                className={fieldClass(!!kmMax)}
              />
              <select name="yakit" defaultValue={yakit} aria-label="Yakıt tipi" className={fieldClass(!!yakit)}>
                <option value="">Yakıt tipi (tümü)</option>
                {FUEL_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              <select name="vites" defaultValue={vites} aria-label="Vites tipi" className={fieldClass(!!vites)}>
                <option value="">Vites tipi (tümü)</option>
                {TRANSMISSION_OPTIONS.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">🤝 Takas Şartları</p>
            <select name="odeme" defaultValue={odemeNiyeti} aria-label="Ödeme niyeti" className={`w-full ${fieldClass(!!odemeNiyeti)}`}>
              <option value="">Ödeme niyeti (tümü)</option>
              {PAYMENT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          <button type="submit" className="w-full text-sm font-semibold text-white rounded-lg px-3 py-1.5" style={{ background: "#4338ca" }}>
            Filtrele
          </button>
        </div>
      </details>

      {hasActiveFilters && (
        <Link href="/takas" className="inline-block mt-2 text-xs font-semibold text-gray-500 hover:text-gray-800 hover:underline">
          Filtreleri Temizle
        </Link>
      )}
    </form>
  );
}
