// Kategori bazlı araç tipi seçenekleri — TEK KAYNAK.
// Admin öneri onay formu (SPEC_FIELDS), araç detay sayfası etiketleri ve
// seed.ts attributeSchema'ları buradan beslenir. Prod DB'deki
// Category.attributeSchema enum'ları da bu listelerle senkron tutulmalı
// (değişiklikte SQL güncellemesi gerekir — bkz. fikape migration workflow).

export type TypeOption = { value: string; label: string };

export const MOTO_TYPES: TypeOption[] = [
  { value: "naked",      label: "Naked" },
  { value: "sport",      label: "Spor" },
  { value: "scooter",    label: "Scooter" },
  { value: "adventure",  label: "Adventure" },
  { value: "touring",    label: "Touring" },
  { value: "enduro",     label: "Enduro" },
  { value: "cross",      label: "Cross" },
  { value: "cruiser",    label: "Cruiser" },
  { value: "retro",      label: "Retro/Klasik" },
  { value: "uc-tekerlekli", label: "Üç Tekerlekli / Kargo" },
];

export const OTOMOBIL_BODY_TYPES: TypeOption[] = [
  { value: "sedan",     label: "Sedan" },
  { value: "hatchback", label: "Hatchback" },
  { value: "suv",       label: "SUV" },
  { value: "station",   label: "Station Wagon" },
  { value: "mpv",       label: "MPV" },
  { value: "coupe",     label: "Coupe" },
  { value: "cabrio",    label: "Cabriolet" },
  { value: "pickup",    label: "Pickup" },
  { value: "van",       label: "Van" },
];

export const OTOMOBIL_SEGMENTS: TypeOption[] = [
  { value: "A", label: "A Segment" },
  { value: "B", label: "B Segment" },
  { value: "C", label: "C Segment" },
  { value: "D", label: "D Segment" },
  { value: "E", label: "E Segment" },
  { value: "F", label: "F Segment" },
];

export const KAMYONET_BODY_TYPES: TypeOption[] = [
  { value: "pickup",   label: "Pickup" },
  { value: "van",      label: "Van" },
  { value: "panelvan", label: "Panelvan" },
  { value: "minivan",  label: "Minivan" },
  { value: "minibus",  label: "Minibüs" },
];

// Kabin konfigürasyonu — yalnız pickup kasa tipinde anlamlı (specFields.ts showIf).
export const KAMYONET_CAB_TYPES: TypeOption[] = [
  { value: "tek_kabin",   label: "Tek Kabin" },
  { value: "bucuk_kabin", label: "Buçuk Kabin" },
  { value: "cift_kabin",  label: "Çift Kabin" },
];

// Van/panelvan/minibüs şasi (dingil mesafesi) boyu ve tavan yüksekliği — aynı modelin
// kısa/uzun versiyonları yük hacmini ve fiyatı ciddi değiştirir.
export const KAMYONET_CHASSIS_LENGTHS: TypeOption[] = [
  { value: "kisa",       label: "Kısa" },
  { value: "orta",       label: "Orta" },
  { value: "uzun",       label: "Uzun" },
  { value: "ekstra_uzun", label: "Ekstra Uzun" },
];

export const KAMYONET_ROOF_HEIGHTS: TypeOption[] = [
  { value: "normal",       label: "Normal Tavan" },
  { value: "orta",         label: "Orta Tavan" },
  { value: "yuksek",       label: "Yüksek Tavan" },
  { value: "cok_yuksek",   label: "Çok Yüksek Tavan" },
];

export const KAMYONET_REAR_DOORS: TypeOption[] = [
  { value: "kanatli",       label: "Kanatlı (Çift Kapı)" },
  { value: "bagaj_kapagi",  label: "Yukarı Açılan Bagaj Kapağı" },
];

// Pickup 4×4 aktarma tipi.
export const KAMYONET_4WD_TYPES: TypeOption[] = [
  { value: "part_time", label: "Part-time (Seçilebilir 4×4)" },
  { value: "full_time", label: "Full-time (Sürekli 4×4)" },
];

export const TRANSMISSION_TYPES: TypeOption[] = [
  { value: "Manuel",        label: "Manuel" },
  { value: "Otomatik",      label: "Otomatik" },
  { value: "CVT",           label: "CVT" },
  { value: "Yarı Otomatik", label: "Yarı Otomatik" },
];

export const KARAVAN_TYPES: TypeOption[] = [
  { value: "cekme",      label: "Çekme Karavan" },
  { value: "motorlu",    label: "Motorlu Karavan" },
  { value: "kamper-van", label: "Kamper Van" },
];

export const HEATING_TYPES: TypeOption[] = [
  { value: "gazli",              label: "Gazlı (Truma/LPG)" },
  { value: "dizel",               label: "Dizel (Webasto/Eberspächer)" },
  { value: "elektrikli",          label: "Elektrikli" },
  { value: "klima-isi-pompasi",   label: "Klima/Isı Pompası" },
  { value: "yok",                 label: "Yok" },
];

export const BIKE_TYPES: TypeOption[] = [
  { value: "sehir",        label: "Şehir" },
  { value: "mtb",          label: "MTB" },
  { value: "yol",          label: "Yol" },
  { value: "kargo",        label: "Kargo" },
  { value: "katlanabilir", label: "Katlanabilir" },
];

export const EBIKE_MOTOR_TYPES: TypeOption[] = [
  { value: "mid-drive", label: "Mid-Drive" },
  { value: "hub-drive", label: "Hub-Drive" },
];

export const PEDELEC_CLASSES: TypeOption[] = [
  { value: "standard-25", label: "25 km/h Standart" },
  { value: "speed-45",    label: "45 km/h Speed" },
];

export const DRIVETRAIN_TYPES: TypeOption[] = [
  { value: "FWD", label: "FWD (Önden Çekiş)" },
  { value: "RWD", label: "RWD (Arkadan İtiş)" },
  { value: "AWD", label: "AWD (Dört Çeker)" },
  { value: "4WD", label: "4WD (Dört Çeker – Manuel Aktarma)" },
];

export function toLabelMap(options: TypeOption[]): Record<string, string> {
  return Object.fromEntries(options.map((o) => [o.value, o.label]));
}

export function toValues(options: TypeOption[]): string[] {
  return options.map((o) => o.value);
}

// Admin spec formu tüm değerleri string gönderir; seed ürünleriyle tutarlı
// olması (ve ileride sayısal filtre/sıralama yapılabilmesi) için sayı ve
// boolean görünümlü stringler gerçek tiplerine çevrilir.
export function normalizeAttributeValues(
  attrs: Record<string, unknown>,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(attrs)) {
    if (typeof value === "string") {
      if (value === "true") { out[key] = true; continue; }
      if (value === "false") { out[key] = false; continue; }
      if (/^-?\d+(\.\d+)?$/.test(value)) { out[key] = Number(value); continue; }
    }
    out[key] = value;
  }
  return out;
}
