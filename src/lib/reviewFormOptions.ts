// Yorum formlarında (yaz/düzenle/güncelle) paylaşılan sabit seçenek listeleri.

export const OWNERSHIP_SLOTS = [
  { key: "new",    label: "Yeni aldım", months: 2  },
  { key: "mid",    label: "3–12 ay",    months: 6  },
  { key: "one3",   label: "1–3 yıl",    months: 24 },
  { key: "three5", label: "3–5 yıl",    months: 48 },
  { key: "five",   label: "5 yıl+",     months: 72 },
];
export const OWNERSHIP_MONTHS: Record<string, number> = Object.fromEntries(
  OWNERSHIP_SLOTS.map((s) => [s.key, s.months])
);

// Kaydedilmiş ownershipMonths değerinden en yakın slot'u bulmak için (düzenleme ön-doldurma)
export function ownershipSlotFromMonths(months: number | null | undefined): string {
  if (months == null) return "";
  let closest = OWNERSHIP_SLOTS[0];
  let closestDiff = Math.abs(OWNERSHIP_SLOTS[0].months - months);
  for (const slot of OWNERSHIP_SLOTS) {
    const diff = Math.abs(slot.months - months);
    if (diff < closestDiff) {
      closest = slot;
      closestDiff = diff;
    }
  }
  return closest.key;
}

export const RECOMMEND_OPTS = [
  { value: "yes",   icon: "👍", label: "Evet" },
  { value: "maybe", icon: "🤷", label: "Kararsızım" },
  { value: "no",    icon: "👎", label: "Hayır" },
] as const;

export const USAGE_OPTS = [
  { value: "city",    icon: "🏙️", label: "Şehir içi" },
  { value: "highway", icon: "🛣️", label: "Şehirlerarası" },
  { value: "mixed",   icon: "🔀", label: "Karma" },
] as const;

export const ROAD_OPTS = [
  { value: "very_good", label: "Çok iyi" },
  { value: "good",      label: "İyi" },
  { value: "okay",      label: "Orta" },
  { value: "poor",      label: "Kötü" },
] as const;

export const FUEL_CONSUMPTION_OPTS = [
  { value: "matches",      label: "Katalogla örtüşüyor" },
  { value: "slightly_over",label: "%10–20 fazla" },
  { value: "much_over",    label: "%20+ fazla" },
] as const;

export const LPG_OPTS = [
  { value: "factory",   label: "Fabrika LPG" },
  { value: "converted", label: "Sonradan dönüştürüldü" },
  { value: "none",      label: "LPG yok" },
] as const;

export const EV_RANGE_OPTS = [
  { value: "matches",      label: "Katalogla örtüşüyor" },
  { value: "slightly_less",label: "Biraz az" },
  { value: "much_less",    label: "Çok az" },
] as const;

export const CHARGING_ACCESS_OPTS = [
  { value: "easy",      label: "Kolay buluyorum" },
  { value: "sometimes", label: "Bazen sıkıntı" },
  { value: "hard",      label: "Çok zor" },
] as const;

export const WINTER_RANGE_OPTS = [
  { value: "minimal",    label: "Az etkileniyor" },
  { value: "noticeable", label: "Belirgin kayıp" },
  { value: "severe",     label: "Çok fazla kayıp" },
] as const;

export const EBIKE_USAGE_OPTS = [
  { value: "sehir", icon: "🏙️", label: "Şehir" },
  { value: "mtb",   icon: "🏔️", label: "MTB" },
  { value: "yol",   icon: "🛣️", label: "Yol" },
  { value: "kargo", icon: "📦", label: "Kargo" },
] as const;

export const EBIKE_MOTOR_OPTS = [
  { value: "mid-drive", label: "Mid-Drive" },
  { value: "hub-drive", label: "Hub-Drive" },
] as const;

export const EBIKE_PEDELEC_OPTS = [
  { value: "standard-25", label: "25 km/h Standart" },
  { value: "speed-45",    label: "45 km/h Speed" },
] as const;

export const EBIKE_WINTER_OPTS = [
  { value: "minimal",     label: "Az etkileniyor" },
  { value: "fark-edilir", label: "Belirgin kayıp" },
  { value: "ciddi",       label: "Çok fazla kayıp" },
] as const;

export interface TurkeySpecificValues {
  usageType: string;
  roadDurability: string;
  fuelConsumption: string;
  lpgStatus: string;
  evRange: string;
  homeCharging: boolean | null;
  chargingAccess: string;
  winterRange: string;
  ebikeMotorType: string;
  ebikePedelecClass: string;
  ebikeRealRangeKm: string;
  ebikeWinterRange: string;
  ebikeChargeHours: string;
}

export const EMPTY_TURKEY_SPECIFIC_VALUES: TurkeySpecificValues = {
  usageType: "", roadDurability: "", fuelConsumption: "", lpgStatus: "", evRange: "",
  homeCharging: null, chargingAccess: "", winterRange: "",
  ebikeMotorType: "", ebikePedelecClass: "", ebikeRealRangeKm: "", ebikeWinterRange: "", ebikeChargeHours: "",
};

// Kaydedilmiş extendedData JSON'undan form state'ini ön-doldurmak için
export function turkeySpecificValuesFromExtendedData(ext: Record<string, unknown>): TurkeySpecificValues {
  const str = (k: string) => (typeof ext[k] === "string" ? (ext[k] as string) : "");
  return {
    usageType:         str("usage_type"),
    roadDurability:    str("road_durability"),
    fuelConsumption:   str("fuel_consumption"),
    lpgStatus:         str("lpg_status"),
    evRange:           str("ev_range"),
    homeCharging:      typeof ext.home_charging === "boolean" ? ext.home_charging : null,
    chargingAccess:    str("charging_access"),
    winterRange:       str("winter_range"),
    ebikeMotorType:    str("motor_type_exp"),
    ebikePedelecClass: str("pedelec_class_exp"),
    ebikeRealRangeKm:  typeof ext.real_range_km === "number" ? String(ext.real_range_km) : "",
    ebikeWinterRange:  str("winter_range_ok"),
    ebikeChargeHours:  typeof ext.charge_time_hours === "number" ? String(ext.charge_time_hours) : "",
  };
}

export function buildExtendedData(
  v: TurkeySpecificValues,
  flags: { isCombustion: boolean; isGasoline: boolean; isEV: boolean; isEscooter: boolean; isEbisiklet: boolean }
): Record<string, unknown> {
  const extended: Record<string, unknown> = {};
  if (v.usageType)      extended.usage_type      = v.usageType;
  if (v.roadDurability) extended.road_durability = v.roadDurability;
  if (flags.isCombustion) {
    if (v.fuelConsumption) extended.fuel_consumption = v.fuelConsumption;
    if (flags.isGasoline && v.lpgStatus) extended.lpg_status = v.lpgStatus;
  }
  if (flags.isEV) {
    if (v.evRange)                extended.ev_range      = v.evRange;
    if (v.homeCharging !== null)  extended.home_charging = v.homeCharging;
    if (!flags.isEscooter && v.chargingAccess) extended.charging_access = v.chargingAccess;
    if (v.winterRange)            extended.winter_range  = v.winterRange;
  }
  if (flags.isEbisiklet) {
    if (v.ebikeMotorType)    extended.motor_type_exp    = v.ebikeMotorType;
    if (v.ebikePedelecClass) extended.pedelec_class_exp = v.ebikePedelecClass;
    if (v.ebikeRealRangeKm)  extended.real_range_km     = Number(v.ebikeRealRangeKm);
    if (v.ebikeWinterRange)  extended.winter_range_ok   = v.ebikeWinterRange;
    if (v.ebikeChargeHours)  extended.charge_time_hours = Number(v.ebikeChargeHours);
  }
  return extended;
}
