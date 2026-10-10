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
  /** "Belirtilmemiş" seçeneğinin etiketini kategori havuzundaki eksik kayıtlara bakarak seçer (verilmezse seçeneğin kendi etiketi). */
  naEtiketi?: (eksikAttrs: Record<string, unknown>[]) => string;
}

/**
 * Motor hacmi boş kalanların tamamı elektrikliyse "Belirtilmemiş" yanıltıcıdır (eksik veri değil, kavram yok);
 * benzinli bir kayıtta hacim boşsa gerçek eksik gizlenmesin diye genel etikete döner.
 */
export const CC_NA_ETIKETI = (eksik: Record<string, unknown>[]): string =>
  eksik.length > 0 && eksik.every((a) => a.fuel_type === "EV") ? "Elektrikli (cc yok)" : "Belirtilmemiş";

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
function eksikVeriliGrup(g: FacetGroup, naEtiketi = "Belirtilmemiş"): FacetGroup {
  return {
    ...g,
    alwaysShow: true,
    options: [
      ...g.options,
      { value: "na", label: naEtiketi, match: (a) => !dolu(a[g.attrKey]) },
    ],
  };
}

/** Sayısal alan için bitişik kovalı grup: [URL değeri, etiket, alt, üst] (sınırlar dahil). */
function aralikGrubu(key: string, label: string, attrKey: string, kovalar: [string, string, number, number][]): FacetGroup {
  return {
    key,
    label,
    attrKey,
    options: kovalar.map(([value, lbl, min, max]) => ({ value, label: lbl, match: (a: Attrs) => inRange(a[attrKey], min, max) })),
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

// ── Karavan'a özgü gruplar ──
const KARAVAN_BERTH_GROUP: FacetGroup = {
  key: "yatak",
  label: "Yatak Kapasitesi",
  attrKey: "berth",
  options: [
    { value: "1-2", label: "1–2 kişi", match: (a) => inRange(a.berth, 1, 2) },
    { value: "3-4", label: "3–4 kişi", match: (a) => inRange(a.berth, 3, 4) },
    { value: "5",   label: "5 kişi +", match: (a) => inRange(a.berth, 5, Infinity) },
  ],
};
const KARAVAN_LENGTH_GROUP: FacetGroup = {
  key: "uzunluk",
  label: "Uzunluk",
  attrKey: "length_cm",
  options: [
    { value: "0-600",   label: "≤ 6 m",  match: (a) => inRange(a.length_cm, 0, 600) },
    { value: "601-700", label: "6–7 m",  match: (a) => inRange(a.length_cm, 601, 700) },
    { value: "701-800", label: "7–8 m",  match: (a) => inRange(a.length_cm, 701, 800) },
    { value: "801",     label: "8 m +",  match: (a) => inRange(a.length_cm, 801, Infinity) },
  ],
};
// 3500 kg: B sınıfı ehliyet sınırı (çekici araç + karavan toplamı ayrıca değerlendirilir; burada yalnız karavanın kendi azami ağırlığı)
const KARAVAN_WEIGHT_GROUP: FacetGroup = {
  key: "agirlik",
  label: "Azami Ağırlık",
  attrKey: "total_weight_kg",
  options: [
    { value: "0-1300",    label: "≤ 1300 kg",     match: (a) => inRange(a.total_weight_kg, 0, 1300) },
    { value: "1301-3500", label: "1301–3500 kg",  match: (a) => inRange(a.total_weight_kg, 1301, 3500) },
    { value: "3501",      label: "3500 kg +",     match: (a) => inRange(a.total_weight_kg, 3501, Infinity) },
  ],
};
// Banyo filtresi kaldırıldı: katalogdaki tüm karavanlarda banyo var, kimseyi elemiyordu. Yerine şebekeden bağımsız kullanımı belirleyen taze su tankı.
const KARAVAN_WATER_GROUP: FacetGroup = {
  key: "su",
  label: "Taze Su Tankı",
  attrKey: "water_tank_l",
  options: [
    { value: "0-25",   label: "≤ 25 L",    match: (a) => inRange(a.water_tank_l, 0, 25) },
    { value: "26-60",  label: "26–60 L",   match: (a) => inRange(a.water_tank_l, 26, 60) },
    { value: "61-100", label: "61–100 L",  match: (a) => inRange(a.water_tank_l, 61, 100) },
    { value: "101",    label: "100 L +",   match: (a) => inRange(a.water_tank_l, 101, Infinity) },
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
    { value: "2wd", label: "4×4 yok", match: (a) => a.four_wd === false || str(a.four_wd) === "false" },
  ],
};

// ── Otomobil ──
const OTO_TRANSMISSION_GROUP: FacetGroup = {
  key: "vites",
  label: "Vites",
  attrKey: "transmission",
  options: [
    { value: "otomatik", label: "Otomatik / CVT", match: (a) => ["Otomatik", "CVT", "Yarı Otomatik"].includes(str(a.transmission)) },
    { value: "manuel",   label: "Manuel",         match: (a) => str(a.transmission) === "Manuel" },
  ],
};
const OTO_DRIVETRAIN_GROUP: FacetGroup = {
  key: "cekis",
  label: "Çekiş",
  attrKey: "drivetrain",
  options: [
    { value: "fwd", label: "Önden çekiş (FWD)",    match: (a) => str(a.drivetrain) === "FWD" },
    { value: "rwd", label: "Arkadan itiş (RWD)",   match: (a) => str(a.drivetrain) === "RWD" },
    { value: "awd", label: "Dört çeker (AWD/4WD)", match: (a) => ["AWD", "4WD"].includes(str(a.drivetrain)) },
  ],
};
const OTO_POWER_GROUP = aralikGrubu("guc", "Motor Gücü", "power_hp", [
  ["0-100", "≤ 100 HP", 0, 100], ["101-150", "101–150 HP", 101, 150], ["151-250", "151–250 HP", 151, 250], ["251", "250 HP +", 251, Infinity],
]);
const OTO_CC_GROUP = aralikGrubu("cc", "Motor Hacmi", "engine_cc", [
  ["0-1000", "≤ 1000 cc", 0, 1000], ["1001-1400", "1001–1400 cc", 1001, 1400], ["1401-1600", "1401–1600 cc", 1401, 1600],
  ["1601-2000", "1601–2000 cc", 1601, 2000], ["2001", "2000 cc +", 2001, Infinity],
]);
const OTO_EV_RANGE_GROUP = aralikGrubu("menzil", "Elektrikli Menzil", "ev_range_km", [
  ["0-300", "≤ 300 km", 0, 300], ["301-450", "301–450 km", 301, 450], ["451", "450 km +", 451, Infinity],
]);
const SEAT_GROUP = aralikGrubu("koltuk", "Koltuk", "seat_count", [
  ["0-4", "≤ 4 koltuk", 0, 4], ["5", "5 koltuk", 5, 5], ["6", "6+ koltuk", 6, Infinity],
]);

// ── Motosiklet ──
const MOTO_POWER_GROUP = aralikGrubu("guc", "Motor Gücü", "power_hp", [
  ["0-48", "≤ 48 HP", 0, 48], ["49-100", "49–100 HP", 49, 100], ["101", "100 HP +", 101, Infinity],
]);
const MOTO_TRANSMISSION_GROUP: FacetGroup = {
  key: "vites",
  label: "Vites",
  attrKey: "transmission",
  options: [
    { value: "manuel",   label: "Manuel",   match: (a) => str(a.transmission) === "Manuel" },
    { value: "otomatik", label: "Otomatik", match: (a) => ["Otomatik", "CVT"].includes(str(a.transmission)) },
  ],
};
const MOTO_SEAT_HEIGHT_GROUP = aralikGrubu("sele", "Sele Yüksekliği", "seat_height_mm", [
  ["0-780", "≤ 780 mm", 0, 780], ["781-820", "781–820 mm", 781, 820], ["821", "820 mm +", 821, Infinity],
]);
const MOTO_ABS_GROUP: FacetGroup = {
  key: "abs",
  label: "ABS",
  attrKey: "abs",
  options: [
    { value: "var", label: "ABS var", match: (a) => isTrue(a.abs) },
    { value: "yok", label: "ABS yok", match: (a) => isFalse(a.abs) },
  ],
};
const MOTO_FUEL_GROUP: FacetGroup = {
  key: "yakit",
  label: "Yakıt",
  attrKey: "fuel_type",
  options: [
    { value: "benzin",   label: "Benzin",     match: (a) => str(a.fuel_type) === "GASOLINE" },
    { value: "elektrik", label: FUEL_LABELS.EV, match: (a) => str(a.fuel_type) === "EV" },
  ],
};

// ── Kamyonet ──
const KAM_POWER_GROUP = aralikGrubu("guc", "Motor Gücü", "power_hp", [
  ["0-130", "≤ 130 HP", 0, 130], ["131-180", "131–180 HP", 131, 180], ["181-250", "181–250 HP", 181, 250], ["251", "250 HP +", 251, Infinity],
]);
const KAM_PAYLOAD_GROUP = aralikGrubu("yuk", "Yük Kapasitesi", "payload_kg", [
  ["0-800", "≤ 800 kg", 0, 800], ["801-1000", "801–1000 kg", 801, 1000], ["1001-1200", "1001–1200 kg", 1001, 1200], ["1201", "1200 kg +", 1201, Infinity],
]);
const KAM_TOW_GROUP = aralikGrubu("cekme", "Çekme Kapasitesi", "tow_capacity_kg", [
  ["0-1500", "≤ 1500 kg", 0, 1500], ["1501-2500", "1501–2500 kg", 1501, 2500], ["2501", "2500 kg +", 2501, Infinity],
]);

const CATEGORY_FACETS: Record<string, FacetGroup[]> = {
  otomobil: [
    eksikVeriliGrup(FUEL_GROUP),
    eksikVeriliGrup(enumGroup("govde", "Gövde", "body_type", toLabelMap(OTOMOBIL_BODY_TYPES))),
    eksikVeriliGrup(enumGroup("segment", "Segment", "segment", toLabelMap(OTOMOBIL_SEGMENTS))),
    eksikVeriliGrup(OTO_TRANSMISSION_GROUP),
    eksikVeriliGrup(OTO_DRIVETRAIN_GROUP),
    eksikVeriliGrup(OTO_POWER_GROUP),
    eksikVeriliGrup(OTO_CC_GROUP, "Yok (elektrikli) / belirtilmemiş"),
    eksikVeriliGrup(OTO_EV_RANGE_GROUP, "Elektrikli değil / belirtilmemiş"),
    eksikVeriliGrup(SEAT_GROUP),
  ],
  motosiklet: [
    eksikVeriliGrup(MOTO_TYPE_GROUP),
    { ...eksikVeriliGrup(CC_GROUP), naEtiketi: CC_NA_ETIKETI },
    eksikVeriliGrup(MOTO_POWER_GROUP),
    eksikVeriliGrup(MOTO_TRANSMISSION_GROUP),
    eksikVeriliGrup(MOTO_SEAT_HEIGHT_GROUP),
    eksikVeriliGrup(MOTO_ABS_GROUP),
    eksikVeriliGrup(MOTO_FUEL_GROUP),
  ],
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
  karavan: [
    eksikVeriliGrup(enumGroup("tip", "Tip", "karavan_type", toLabelMap(KARAVAN_TYPES))),
    eksikVeriliGrup(KARAVAN_BERTH_GROUP),
    eksikVeriliGrup(KARAVAN_LENGTH_GROUP),
    eksikVeriliGrup(KARAVAN_WEIGHT_GROUP),
    eksikVeriliGrup(KARAVAN_WATER_GROUP),
  ],
  // Gövde ilk sırada — "kamyonet" pickup/panelvan/van/minivan karışımı bir
  // hafif-ticari çatısı; kullanıcının ilk daralttığı boyut kasa tipi.
  kamyonet: [
    eksikVeriliGrup(enumGroup("govde", "Gövde", "body_type", toLabelMap(KAMYONET_BODY_TYPES))),
    eksikVeriliGrup(FUEL_GROUP),
    eksikVeriliGrup(FOUR_WD_GROUP),
    eksikVeriliGrup(enumGroup("kabin", "Kabin", "cab_type", toLabelMap(KAMYONET_CAB_TYPES)), "Pickup değil / belirtilmemiş"),
    eksikVeriliGrup(enumGroup("vites", "Vites", "transmission", toLabelMap(TRANSMISSION_TYPES))),
    eksikVeriliGrup(KAM_POWER_GROUP),
    eksikVeriliGrup(KAM_PAYLOAD_GROUP),
    eksikVeriliGrup(KAM_TOW_GROUP),
    eksikVeriliGrup(SEAT_GROUP),
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
