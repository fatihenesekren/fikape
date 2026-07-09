import {
  MOTO_TYPES, OTOMOBIL_BODY_TYPES, OTOMOBIL_SEGMENTS, KAMYONET_BODY_TYPES,
  KARAVAN_TYPES, BIKE_TYPES, EBIKE_MOTOR_TYPES, PEDELEC_CLASSES,
} from "@/lib/vehicleTypes";

export type FieldDef =
  | { key: string; label: string; type: "number"; unit?: string; placeholder?: string }
  | { key: string; label: string; type: "select"; options: { value: string; label: string }[] }
  | { key: string; label: string; type: "boolean" }
  | { key: string; label: string; type: "text"; placeholder?: string };

// Kategori bazlı teknik özellik form alanları — admin öneri onay formu ve
// ürün düzenleme formu (/admin/urunler) tarafından ortak kullanılır.
export const SPEC_FIELDS: Record<string, FieldDef[]> = {
  otomobil: [
    { key: "body_type",    label: "Kasa",      type: "select", options: OTOMOBIL_BODY_TYPES },
    { key: "segment",      label: "Segment",   type: "select", options: OTOMOBIL_SEGMENTS },
    { key: "drivetrain",   label: "Çekiş",     type: "select", options: [
      { value: "FWD", label: "Önden Çekiş (FWD)" }, { value: "RWD", label: "Arkadan İtiş (RWD)" },
      { value: "AWD", label: "Dört Çeker (AWD)" }, { value: "4WD", label: "4WD" },
    ]},
    { key: "transmission", label: "Vites",     type: "select", options: [
      { value: "Manuel", label: "Manuel" }, { value: "Otomatik", label: "Otomatik" },
      { value: "CVT", label: "CVT" }, { value: "Yarı Otomatik", label: "Yarı Otomatik" },
    ]},
    { key: "engine_cc",    label: "Motor",     type: "number", unit: "cc" },
    { key: "power_hp",     label: "Güç",       type: "number", unit: "HP" },
    { key: "torque_nm",    label: "Tork",      type: "number", unit: "Nm" },
    { key: "zero_to_100",  label: "0–100",     type: "number", unit: "sn", placeholder: "örn. 8.5" },
    { key: "top_speed_kmh",label: "Azami Hız", type: "number", unit: "km/s" },
    { key: "tank_l",       label: "Yakıt Dep.",type: "number", unit: "L" },
    { key: "battery_kwh",  label: "Batarya",   type: "number", unit: "kWh" },
    { key: "ev_range_km",  label: "Menzil",    type: "number", unit: "km (WLTP)" },
    { key: "boot_l",       label: "Bagaj",     type: "number", unit: "L" },
    { key: "weight_kg",    label: "Ağırlık",   type: "number", unit: "kg" },
  ],
  motosiklet: [
    { key: "moto_type",    label: "Tip",       type: "select", options: MOTO_TYPES },
    { key: "engine_cc",    label: "Motor",      type: "number", unit: "cc" },
    { key: "power_hp",     label: "Güç",        type: "number", unit: "HP" },
    { key: "torque_nm",    label: "Tork",       type: "number", unit: "Nm" },
    { key: "gearbox",      label: "Şanzıman",   type: "number", unit: "vites", placeholder: "örn. 6" },
    { key: "abs",          label: "ABS",        type: "boolean" },
    { key: "tank_l",       label: "Depo",       type: "number", unit: "L" },
    { key: "weight_kg",    label: "Ağırlık",    type: "number", unit: "kg" },
    { key: "seat_height_mm", label: "Sele Yüks.", type: "number", unit: "mm" },
    { key: "ev_range_km",  label: "Menzil (EV)", type: "number", unit: "km" },
  ],
  "e-scooter": [
    { key: "motor_watt",    label: "Motor Gücü",   type: "number", unit: "W" },
    { key: "range_km",      label: "Menzil",       type: "number", unit: "km" },
    { key: "max_speed_kmh", label: "Maks. Hız",    type: "number", unit: "km/s" },
    { key: "battery_wh",    label: "Batarya",      type: "number", unit: "Wh" },
    { key: "weight_kg",     label: "Ağırlık",      type: "number", unit: "kg" },
    { key: "charge_hours",  label: "Şarj Süresi",  type: "number", unit: "saat" },
    { key: "ip_rating",     label: "Su Ger.",       type: "text", placeholder: "örn. IP54" },
    { key: "max_load_kg",   label: "Maks. Yük",    type: "number", unit: "kg" },
    { key: "tire_inch",     label: "Lastik",       type: "number", unit: "\"" },
  ],
  "e-bisiklet": [
    { key: "bike_type",    label: "Bisiklet Tipi", type: "select", options: BIKE_TYPES },
    { key: "motor_type",   label: "Motor Tipi",    type: "select", options: EBIKE_MOTOR_TYPES },
    { key: "pedelec_class", label: "Pedelec",      type: "select", options: PEDELEC_CLASSES },
    { key: "motor_watt",   label: "Motor Gücü",    type: "number", unit: "W" },
    { key: "battery_wh",   label: "Batarya",       type: "number", unit: "Wh" },
    { key: "range_km",     label: "Menzil",        type: "number", unit: "km" },
    { key: "max_speed_kmh",label: "Maks. Hız",     type: "number", unit: "km/s" },
    { key: "weight_kg",    label: "Ağırlık",       type: "number", unit: "kg" },
  ],
  karavan: [
    { key: "karavan_type", label: "Tip",            type: "select", options: KARAVAN_TYPES },
    { key: "berth",          label: "Yatak Kap.",   type: "number", unit: "kişi" },
    { key: "length_cm",      label: "Uzunluk",      type: "number", unit: "cm" },
    { key: "width_cm",       label: "Genişlik",     type: "number", unit: "cm" },
    { key: "total_weight_kg",label: "Toplam Ağ.",   type: "number", unit: "kg" },
    { key: "tow_weight_kg",  label: "Çekme Ağ.",    type: "number", unit: "kg" },
    { key: "has_bathroom",   label: "Banyo",        type: "boolean" },
    { key: "has_kitchen",    label: "Mutfak",       type: "boolean" },
    { key: "has_ac",         label: "Klima",        type: "boolean" },
  ],
  kamyonet: [
    { key: "body_type",     label: "Kasa",          type: "select", options: KAMYONET_BODY_TYPES },
    { key: "engine_cc",     label: "Motor",         type: "number", unit: "cc" },
    { key: "power_hp",      label: "Güç",           type: "number", unit: "HP" },
    { key: "torque_nm",     label: "Tork",          type: "number", unit: "Nm" },
    { key: "four_wd",       label: "4×4",           type: "boolean" },
    { key: "payload_kg",    label: "Yük Kap.",      type: "number", unit: "kg" },
    { key: "tow_capacity_kg",label: "Çekme Kap.",   type: "number", unit: "kg" },
    { key: "tank_l",        label: "Yakıt Dep.",    type: "number", unit: "L" },
  ],
};
