export interface Chip {
  key: string;
  label: string;
}

export const COMMON_CHIPS: Chip[] = [
  { key: "reliability",      label: "Güvenilirlik" },
  { key: "maintenance_cost", label: "Bakım maliyeti" },
  { key: "service_exp",      label: "Servis deneyimi" },
  { key: "value_for_money",  label: "Fiyat/performans" },
];

export const CATEGORY_CHIPS: Record<string, Chip[]> = {
  otomobil: [
    { key: "fuel_consumption",  label: "Yakıt tüketimi" },
    { key: "trunk_space",       label: "Bagaj hacmi" },
    { key: "ac_performance",    label: "Klima performansı" },
    { key: "park_assist",       label: "Park asistanı" },
    { key: "sound_insulation",  label: "Ses yalıtımı" },
  ],
  motosiklet: [
    { key: "maneuverability",   label: "Manevra kabiliyeti" },
    { key: "abs_performance",   label: "ABS performansı" },
    { key: "seat_comfort",      label: "Sele konforu" },
    { key: "braking",           label: "Fren sistemi" },
    { key: "wind_protection",   label: "Rüzgar koruması" },
  ],
  "e-scooter": [
    { key: "charge_time",       label: "Şarj süresi" },
    { key: "real_range",        label: "Gerçek menzil" },
    { key: "ip_protection",     label: "IP koruması" },
    { key: "portability",       label: "Taşınabilirlik" },
    { key: "tire_quality",      label: "Lastik kalitesi" },
  ],
  karavan: [
    { key: "bed_comfort",       label: "Yatak konforu" },
    { key: "kitchen",           label: "Mutfak donanımı" },
    { key: "bathroom",          label: "Banyo kalitesi" },
    { key: "insulation",        label: "Isı izolasyonu" },
    { key: "storage",           label: "Depolama alanı" },
  ],
  kamyonet: [
    { key: "load_capacity",     label: "Yük kapasitesi" },
    { key: "towing_power",      label: "Çekme gücü" },
    { key: "cargo_quality",     label: "Kasa kalitesi" },
    { key: "high_torque",       label: "Yüksek tork" },
  ],
  "e-bisiklet": [
    { key: "real_range",        label: "Gerçek menzil" },
    { key: "motor_power",       label: "Motor gücü" },
    { key: "charging_ease",     label: "Şarj kolaylığı" },
    { key: "weight",            label: "Ağırlık" },
    { key: "ride_comfort",      label: "Sürüş konforu" },
  ],
};

export function getChipsForCategory(categorySlug: string | null): Chip[] {
  const specific = categorySlug ? (CATEGORY_CHIPS[categorySlug] ?? []) : [];
  return [...COMMON_CHIPS, ...specific];
}

export const CHIP_LABEL: Record<string, string> = Object.fromEntries(
  [...COMMON_CHIPS, ...Object.values(CATEGORY_CHIPS).flat()].map((c) => [c.key, c.label])
);
