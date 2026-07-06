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
  { value: "elektrikli", label: "Elektrikli" },
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
];

export const KARAVAN_TYPES: TypeOption[] = [
  { value: "cekme",      label: "Çekme Karavan" },
  { value: "motorlu",    label: "Motorlu Karavan" },
  { value: "kamper-van", label: "Kamper Van" },
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
