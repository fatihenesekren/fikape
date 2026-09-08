// Katalog (/araclar) facet tanımları — kategoriye özel filtre boyutları.
//
// TEK KAYNAK: enum etiketleri @/lib/vehicleTypes ve @/lib/fuel'den gelir;
// sayısal aralık kovaları (cc / W) burada tanımlıdır. Bu dosya BİLİNÇLİ olarak
// @/lib/quiz'e HİÇ bağımlı DEĞİL — "4 soruda araç bul" akışının bu işten
// etkilenmemesi kullanıcı şartı (bkz. backlog_anasayfa_katalog_ayirma memory).
// Gruplamalar quiz'deki OTO_FUEL_MAP / MOTO_TYPE_MAP / *_WATT_RANGES ile
// kavramsal olarak aynı tutulur ama ayrı yaşar.

import { FUEL_LABELS } from "@/lib/fuel";
import {
  OTOMOBIL_BODY_TYPES, OTOMOBIL_SEGMENTS, KARAVAN_TYPES, BIKE_TYPES, toLabelMap,
} from "@/lib/vehicleTypes";

type Attrs = Record<string, unknown>;

export interface FacetOption {
  value: string;                       // URL değeri
  label: string;                       // görünen etiket
  match: (attrs: Attrs) => boolean;    // bir ürün bu seçeneğe uyuyor mu
}

export interface FacetGroup {
  key: string;        // URL param adı: yakit, govde, segment, tip, cc, guc, cekis
  label: string;      // "Yakıt"
  attrKey: string;    // kapsam kontrolü için ham attribute anahtarı
  options: FacetOption[];
}

const str = (v: unknown) => (v == null ? "" : String(v));
const num = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};
const inRange = (v: unknown, min: number, max: number) => {
  const n = num(v);
  return n != null && n >= min && n <= max;
};

// ── Yakıt (otomobil + kamyonet) — LPG "Benzin" altında, PHEV "Hibrit" altında ──
const FUEL_GROUP: FacetGroup = {
  key: "yakit",
  label: "Yakıt",
  attrKey: "fuel_type",
  options: [
    { value: "benzin",   label: "Benzin / LPG", match: (a) => ["GASOLINE", "LPG"].includes(str(a.fuel_type)) },
    { value: "dizel",    label: FUEL_LABELS.DIESEL, match: (a) => str(a.fuel_type) === "DIESEL" },
    { value: "hibrit",   label: "Hibrit", match: (a) => ["HYBRID", "PHEV"].includes(str(a.fuel_type)) },
    { value: "elektrik", label: FUEL_LABELS.EV, match: (a) => str(a.fuel_type) === "EV" },
  ],
};

// ── Motor hacmi (motosiklet) — bitişik kovalar (quiz'deki boşluklu aralıklar değil) ──
const CC_GROUP: FacetGroup = {
  key: "cc",
  label: "Motor Hacmi",
  attrKey: "engine_cc",
  options: [
    { value: "0-250",   label: "≤ 250 cc",   match: (a) => inRange(a.engine_cc, 0, 250) },
    { value: "251-500", label: "251–500 cc", match: (a) => inRange(a.engine_cc, 251, 500) },
    { value: "501-800", label: "501–800 cc", match: (a) => inRange(a.engine_cc, 501, 800) },
    { value: "801",     label: "801 cc+",    match: (a) => inRange(a.engine_cc, 801, Infinity) },
  ],
};

// ── Motor gücü (e-scooter + e-bisiklet) ──
const wattGroup = (key = "guc"): FacetGroup => ({
  key,
  label: "Motor Gücü",
  attrKey: "motor_watt",
  options: [
    { value: "0-350",   label: "≤ 350 W",   match: (a) => inRange(a.motor_watt, 0, 350) },
    { value: "351-500", label: "351–500 W", match: (a) => inRange(a.motor_watt, 351, 500) },
    { value: "501",     label: "500 W+",    match: (a) => inRange(a.motor_watt, 501, Infinity) },
  ],
});

// ── Enum tabanlı grup üreteci ──
function enumGroup(
  key: string,
  label: string,
  attrKey: string,
  labelMap: Record<string, string>,
): FacetGroup {
  return {
    key,
    label,
    attrKey,
    options: Object.entries(labelMap).map(([value, lbl]) => ({
      value,
      label: lbl,
      match: (a) => str(a[attrKey]) === value,
    })),
  };
}

// ── Motosiklet "Tip" — 10 ham değer 4 kovaya (quiz MOTO_TYPE_MAP mantığı) ──
const MOTO_TYPE_BUCKETS: Record<string, string[]> = {
  naked:   ["naked", "retro", "cruiser"],
  sport:   ["sport"],
  scooter: ["scooter"],
  tur:     ["adventure", "touring", "enduro", "cross"],
};
const MOTO_TYPE_GROUP: FacetGroup = {
  key: "tip",
  label: "Tip",
  attrKey: "moto_type",
  options: [
    { value: "naked",   label: "Naked / Klasik",  match: (a) => MOTO_TYPE_BUCKETS.naked.includes(str(a.moto_type)) },
    { value: "sport",   label: "Spor",            match: (a) => MOTO_TYPE_BUCKETS.sport.includes(str(a.moto_type)) },
    { value: "scooter", label: "Scooter",         match: (a) => MOTO_TYPE_BUCKETS.scooter.includes(str(a.moto_type)) },
    { value: "tur",     label: "Adventure / Tur", match: (a) => MOTO_TYPE_BUCKETS.tur.includes(str(a.moto_type)) },
  ],
};

const FOUR_WD_GROUP: FacetGroup = {
  key: "cekis",
  label: "Çekiş",
  attrKey: "four_wd",
  options: [
    { value: "4x4", label: "4×4 var", match: (a) => a.four_wd === true || str(a.four_wd) === "true" },
    { value: "2wd", label: "4×4 yok", match: (a) => !(a.four_wd === true || str(a.four_wd) === "true") },
  ],
};

const CATEGORY_FACETS: Record<string, FacetGroup[]> = {
  otomobil: [
    FUEL_GROUP,
    enumGroup("govde", "Gövde", "body_type", toLabelMap(OTOMOBIL_BODY_TYPES)),
    enumGroup("segment", "Segment", "segment", toLabelMap(OTOMOBIL_SEGMENTS)),
  ],
  motosiklet: [MOTO_TYPE_GROUP, CC_GROUP],
  "e-scooter": [wattGroup("guc")],
  "e-bisiklet": [
    enumGroup("tip", "Tip", "bike_type", toLabelMap(BIKE_TYPES)),
    wattGroup("guc"),
  ],
  karavan: [enumGroup("tip", "Tip", "karavan_type", toLabelMap(KARAVAN_TYPES))],
  kamyonet: [FUEL_GROUP, FOUR_WD_GROUP],
};

export function facetGroupsForCategory(categorySlug: string | undefined): FacetGroup[] {
  if (!categorySlug) return [];
  return CATEGORY_FACETS[categorySlug] ?? [];
}

// Kapsam kapısı — o havuzdaki ürünlerin en az %90'ında ilgili alan dolu değilse
// facet gösterilmez (elle veri girişinde yarım kataloğu sessizce eleyen facet,
// hiç facet olmamasından kötü — bkz. veri kalitesi değerlendirmesi).
export const FACET_COVERAGE_THRESHOLD = 0.9;

export function fieldCoverage(pool: { attributes: unknown }[], attrKey: string): number {
  if (pool.length === 0) return 0;
  let filled = 0;
  for (const p of pool) {
    const v = (p.attributes as Attrs)?.[attrKey];
    // boolean facet'lerde false da "dolu" sayılır
    if (v === false || (v != null && v !== "")) filled++;
  }
  return filled / pool.length;
}

// Bir ürün seçili facet'lere uyuyor mu — her grup İÇİNDE VEYA, gruplar arası VE.
export function productMatchesFacets(
  attrs: Attrs,
  groups: FacetGroup[],
  selected: Record<string, string[]>,
): boolean {
  for (const g of groups) {
    const picks = selected[g.key];
    if (!picks || picks.length === 0) continue;
    const opts = g.options.filter((o) => picks.includes(o.value));
    if (opts.length === 0) continue;
    if (!opts.some((o) => o.match(attrs))) return false;
  }
  return true;
}
