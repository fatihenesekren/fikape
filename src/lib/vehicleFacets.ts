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
  OTOMOBIL_BODY_TYPES, OTOMOBIL_SEGMENTS, KARAVAN_TYPES, BIKE_TYPES,
  KAMYONET_BODY_TYPES, KAMYONET_CAB_TYPES, TRANSMISSION_TYPES,
  toLabelMap,
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
  /** true: kapsam kapısı uygulanmaz; eksik veri "Belirtilmemiş" seçeneğiyle görünür kalır. */
  alwaysShow?: boolean;
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

const dolu = (v: unknown) => v === false || (v != null && v !== "");

/** Gruba "Belirtilmemiş" seçeneği ekler ve kapsam kapısını kaldırır — veri yarım olsa da hiçbir kayıt sessizce elenmez. */
function eksikVeriliGrup(g: FacetGroup): FacetGroup {
  return {
    ...g,
    alwaysShow: true,
    options: [
      ...g.options,
      { value: "na", label: "Belirtilmemiş", match: (a) => !dolu(a[g.attrKey]) },
    ],
  };
}

// ── E-bisiklete özgü gruplar ──
const EBIKE_MOTOR_GROUP: FacetGroup = {
  key: "motor",
  label: "Motor Tipi",
  attrKey: "motor_type",
  options: [
    { value: "mid", label: "Orta motor (Mid-Drive)", match: (a) => str(a.motor_type) === "mid-drive" },
    { value: "hub", label: "Göbek motoru (Hub-Drive)", match: (a) => str(a.motor_type) === "hub-drive" },
  ],
};
const EBIKE_WATT_GROUP: FacetGroup = {
  key: "guc",
  label: "Motor Gücü",
  attrKey: "motor_watt",
  options: [
    { value: "0-250",   label: "≤ 250 W",   match: (a) => inRange(a.motor_watt, 0, 250) },
    { value: "251-500", label: "251–500 W", match: (a) => inRange(a.motor_watt, 251, 500) },
    { value: "501",     label: "500 W+",    match: (a) => inRange(a.motor_watt, 501, Infinity) },
  ],
};
const EBIKE_BATTERY_GROUP: FacetGroup = {
  key: "batarya",
  label: "Batarya",
  attrKey: "battery_wh",
  options: [
    { value: "0-400",   label: "≤ 400 Wh",   match: (a) => inRange(a.battery_wh, 0, 400) },
    { value: "401-600", label: "401–600 Wh", match: (a) => inRange(a.battery_wh, 401, 600) },
    { value: "601",     label: "600 Wh+",    match: (a) => inRange(a.battery_wh, 601, Infinity) },
  ],
};
const EBIKE_RANGE_GROUP: FacetGroup = {
  key: "menzil",
  label: "Menzil",
  attrKey: "range_km",
  options: [
    { value: "0-40",  label: "≤ 40 km",  match: (a) => inRange(a.range_km, 0, 40) },
    { value: "41-70", label: "41–70 km", match: (a) => inRange(a.range_km, 41, 70) },
    { value: "71",    label: "70 km+",   match: (a) => inRange(a.range_km, 71, Infinity) },
  ],
};

// ── E-scooter'a özgü gruplar (veri 250 W'tan 13 kW'a, 25'ten 130 km/s'ye uzanır) ──
const ESCOOTER_WATT_GROUP: FacetGroup = {
  key: "guc",
  label: "Motor Gücü",
  attrKey: "motor_watt",
  options: [
    { value: "0-500",     label: "≤ 500 W",       match: (a) => inRange(a.motor_watt, 0, 500) },
    { value: "501-1000",  label: "501–1000 W",    match: (a) => inRange(a.motor_watt, 501, 1000) },
    { value: "1001-2000", label: "1001–2000 W",   match: (a) => inRange(a.motor_watt, 1001, 2000) },
    { value: "2001",      label: "2000 W+",       match: (a) => inRange(a.motor_watt, 2001, Infinity) },
  ],
};
const ESCOOTER_SPEED_GROUP: FacetGroup = {
  key: "hiz",
  label: "Maks. Hız",
  attrKey: "max_speed_kmh",
  options: [
    { value: "0-25",  label: "≤ 25 km/s",    match: (a) => inRange(a.max_speed_kmh, 0, 25) },
    { value: "26-45", label: "26–45 km/s",   match: (a) => inRange(a.max_speed_kmh, 26, 45) },
    { value: "46",    label: "45 km/s +",    match: (a) => inRange(a.max_speed_kmh, 46, Infinity) },
  ],
};
const ESCOOTER_RANGE_GROUP: FacetGroup = {
  key: "menzil",
  label: "Menzil",
  attrKey: "range_km",
  options: [
    { value: "0-50",   label: "≤ 50 km",    match: (a) => inRange(a.range_km, 0, 50) },
    { value: "51-100", label: "51–100 km",  match: (a) => inRange(a.range_km, 51, 100) },
    { value: "101",    label: "100 km+",    match: (a) => inRange(a.range_km, 101, Infinity) },
  ],
};
const ESCOOTER_BATTERY_GROUP: FacetGroup = {
  key: "batarya",
  label: "Batarya",
  attrKey: "battery_wh",
  options: [
    { value: "0-500",    label: "≤ 500 Wh",     match: (a) => inRange(a.battery_wh, 0, 500) },
    { value: "501-1000", label: "501–1000 Wh",  match: (a) => inRange(a.battery_wh, 501, 1000) },
    { value: "1001",     label: "1000 Wh+",     match: (a) => inRange(a.battery_wh, 1001, Infinity) },
  ],
};
const isTrue = (v: unknown) => v === true || str(v) === "true";
const isFalse = (v: unknown) => v === false || str(v) === "false";
const ESCOOTER_FOLD_GROUP: FacetGroup = {
  key: "katlan",
  label: "Katlanabilir",
  attrKey: "foldable",
  options: [
    { value: "evet", label: "Katlanabilir", match: (a) => isTrue(a.foldable) },
    { value: "hayir", label: "Katlanamaz",  match: (a) => isFalse(a.foldable) },
  ],
};

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
  "e-scooter": [
    eksikVeriliGrup(ESCOOTER_WATT_GROUP),
    eksikVeriliGrup(ESCOOTER_SPEED_GROUP),
    eksikVeriliGrup(ESCOOTER_RANGE_GROUP),
    eksikVeriliGrup(ESCOOTER_BATTERY_GROUP),
    eksikVeriliGrup(ESCOOTER_FOLD_GROUP),
  ],
  "e-bisiklet": [
    eksikVeriliGrup(enumGroup("tip", "Tip", "bike_type", toLabelMap(BIKE_TYPES))),
    eksikVeriliGrup(EBIKE_MOTOR_GROUP),
    eksikVeriliGrup(EBIKE_WATT_GROUP),
    eksikVeriliGrup(EBIKE_BATTERY_GROUP),
    eksikVeriliGrup(EBIKE_RANGE_GROUP),
  ],
  karavan: [enumGroup("tip", "Tip", "karavan_type", toLabelMap(KARAVAN_TYPES))],
  // Gövde ilk sırada — "kamyonet" pickup/panelvan/van/minivan karışımı bir
  // hafif-ticari çatısı; kullanıcının ilk daralttığı boyut kasa tipi.
  kamyonet: [
    enumGroup("govde", "Gövde", "body_type", toLabelMap(KAMYONET_BODY_TYPES)),
    FUEL_GROUP,
    FOUR_WD_GROUP,
    enumGroup("kabin", "Kabin", "cab_type", toLabelMap(KAMYONET_CAB_TYPES)),
    enumGroup("vites", "Vites", "transmission", toLabelMap(TRANSMISSION_TYPES)),
  ],
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
