"use client";

import { useRef, useState } from "react";
import { VoiceMicButton } from "@/components/VoiceMicButton";

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

type TakasFilterFormProps = {
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
};

// Alanlar defaultValue/ilk-durumla kurulur; kayıtlı aramalar arasında istemci gezintisinde adres değişince form eski
// seçimi tutuyordu. Adresteki filtre değerleriyle anahtarlanan İÇ bileşen her değişimde sıfırdan kurulur (anahtarı
// sunucu sayfasına koymak eski formun ekranda kalmasına yol açıyordu).
export function TakasFilterForm(props: TakasFilterFormProps) {
  const p = props;
  const anahtar = [p.il, p.kategoriSlug, p.markaSlug, p.odemeNiyeti, p.yilMin, p.yilMax, p.kmMin, p.kmMax, p.yakit, p.vites, p.q].join("|");
  return <TakasFilterFormIci key={anahtar} {...props} />;
}

function TakasFilterFormIci({
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
}: TakasFilterFormProps) {
  const [kategori, setKategori] = useState(kategoriSlug);
  const qInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const availableBrands = kategori ? brands.filter((b) => categoryBrandMap[kategori]?.includes(b.slug)) : brands;
  // Hızlı Arama (serbest metin) ve Detaylı Arama (il/kategori/marka/ödeme/yıl/
  // km/yakıt/vites) görsel olarak ayrıldı ama aynı <form>/query string'i
  // paylaşıyorlar — ikisi de uygulanmışsa AND ile birleşiyor (kullanıcı onayı:
  // "birlikte çalışsın"). Detaylı Arama paneli, içinde aktif filtre varsa
  // varsayılan açık geliyor (bkz. 5 uzman ajan oylaması — kullanıcı sayfaya
  // döndüğünde ne uygulandığını görsün), yoksa kapalı başlıyor.
  const activeDetailedFields = [il, kategoriSlug, markaSlug, odemeNiyeti, yilMin, yilMax, kmMin, kmMax, yakit, vites].filter(Boolean);
  const hasDetailedFilters = activeDetailedFields.length > 0;
  // Görsel gruplandırma — önceden 8 alan tek kalabalık grid'de karışıyordu,
  // hangisinin ne için olduğu ayırt edilemiyordu (bkz. 5 uzman ajan
  // değerlendirmesi). Aktif olan alan hafif accent kenarlıkla vurgulanıyor.
  const fieldClass = (active: boolean) =>
    `text-base sm:text-sm min-h-11 sm:min-h-9 rounded-lg border px-2.5 py-1.5 ${active ? "border-link bg-link-soft/40" : "border-gray-400"}`;

  return (
    <form ref={formRef} method="get">
      <div className="mb-2">
        <label htmlFor="takas-q" className="block text-xs font-bold text-gray-600 mb-1">
          <span aria-hidden="true">🔍</span> Hızlı Arama
        </label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              ref={qInputRef}
              id="takas-q"
              type="text"
              name="q"
              defaultValue={q}
              placeholder="Marka, model veya versiyon ara…"
              className="w-full text-base sm:text-sm min-h-11 sm:min-h-9 rounded-lg border border-gray-400 pl-2.5 pr-9 py-1.5"
            />
            <VoiceMicButton inputRef={qInputRef} formRef={formRef} />
          </div>
          <button type="submit" className="text-sm font-semibold text-white rounded-lg px-4 py-1.5 min-h-11 sm:min-h-9 whitespace-nowrap focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link" style={{ background: "#0C447C" }}>
            Ara
          </button>
        </div>
      </div>

      <details className="border border-gray-400 rounded-lg overflow-hidden" open={hasDetailedFilters}>
        <summary className="cursor-pointer select-none flex items-center justify-between min-h-11 text-xs font-bold text-gray-600 px-3 py-2.5">
          <span><span aria-hidden="true">🎛️</span> Detaylı Arama</span>
          {hasDetailedFilters && (
            <span className="text-[11px] font-semibold text-link bg-link-soft px-2 py-0.5 rounded-full">
              {activeDetailedFields.length} filtre aktif
            </span>
          )}
        </summary>
        <div className="p-3 pt-1 space-y-3.5">
          <div>
            <p className="text-[11px] font-semibold text-gray-600 uppercase tracking-wide mb-1.5"><span aria-hidden="true">📍</span> Konum ve Kategori</p>
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
            <p className="text-[11px] font-semibold text-gray-600 uppercase tracking-wide mb-1.5"><span aria-hidden="true">🚗</span> Araç Kriterleri</p>
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
            <p className="text-[11px] font-semibold text-gray-600 uppercase tracking-wide mb-1.5"><span aria-hidden="true">🤝</span> Takas Şartları</p>
            <select name="odeme" defaultValue={odemeNiyeti} aria-label="Ödeme niyeti" className={`w-full ${fieldClass(!!odemeNiyeti)}`}>
              <option value="">Ödeme niyeti (tümü)</option>
              {PAYMENT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          <button type="submit" className="w-full text-sm font-semibold text-white rounded-lg px-3 py-1.5 min-h-11 sm:min-h-9 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link" style={{ background: "#0C447C" }}>
            Filtrele
          </button>
        </div>
      </details>
    </form>
  );
}
