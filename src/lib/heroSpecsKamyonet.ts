// Araç sayfası üst şeridi (hero spec strip) — kamyonet kategorisi, kasa tipine göre
// 5 öne çıkan özellik. Her kasa için aday listesi önem sırasıyla verilir; verisi
// olmayan aday atlanır, sıradaki öne geçer (şerit boş kutu göstermez).
import {
  KAMYONET_CAB_TYPES, KAMYONET_CHASSIS_LENGTHS, KAMYONET_ROOF_HEIGHTS, KAMYONET_4WD_TYPES,
  DRIVETRAIN_TYPES, toLabelMap,
} from "@/lib/vehicleTypes";
import type { SpecItem } from "@/lib/buildSpecList";

const CAB_LABELS = toLabelMap(KAMYONET_CAB_TYPES);
const CHASSIS_LABELS = toLabelMap(KAMYONET_CHASSIS_LENGTHS);
const ROOF_LABELS = toLabelMap(KAMYONET_ROOF_HEIGHTS);
const FOURWD_SHORT: Record<string, string> = Object.fromEntries(
  KAMYONET_4WD_TYPES.map((o) => [o.value, o.value === "part_time" ? "Part-time" : "Full-time"]),
);
const DRIVETRAIN_LABELS = toLabelMap(DRIVETRAIN_TYPES);

const MAX_ITEMS = 5;

type Attrs = Record<string, unknown>;
type Candidate = SpecItem | null;

const has = (v: unknown) => v !== undefined && v !== null && v !== "" && v !== 0;

const power = (a: Attrs): Candidate => has(a.power_hp) ? { label: "Güç", value: `${a.power_hp} HP` } : null;
const payload = (a: Attrs): Candidate => has(a.payload_kg) ? { label: "Yük Kapasitesi", value: `${a.payload_kg} kg` } : null;
const cargo = (a: Attrs): Candidate => has(a.cargo_m3) ? { label: "Kargo Hacmi", value: `${a.cargo_m3} m³` } : null;
const seats = (a: Attrs): Candidate => has(a.seat_count) ? { label: "Koltuk Sayısı", value: `${a.seat_count} kişi` } : null;
const boot = (a: Attrs): Candidate => has(a.boot_l) ? { label: "Bagaj", value: `${a.boot_l} L` } : null;
const tow = (a: Attrs): Candidate => has(a.tow_capacity_kg) ? { label: "Çekme Kapasitesi", value: `${a.tow_capacity_kg} kg` } : null;
const cargoLength = (a: Attrs): Candidate => has(a.cargo_length_mm) ? { label: "Yük Boyu", value: `${a.cargo_length_mm} mm` } : null;
const slidingDoors = (a: Attrs): Candidate =>
  has(a.sliding_door_count) ? { label: "Sürgülü Kapı", value: `${a.sliding_door_count} adet` } : null;
const bedLength = (a: Attrs): Candidate => has(a.bed_length_mm) ? { label: "Kasa Boyu", value: `${a.bed_length_mm} mm` } : null;
const clearance = (a: Attrs): Candidate => has(a.ground_clearance_mm) ? { label: "Yerden Yükseklik", value: `${a.ground_clearance_mm} mm` } : null;

// Şasi boyu + tavan tek kutuda: "Uzun · Orta Tavan".
function chassisRoof(a: Attrs): Candidate {
  const c = has(a.chassis_length) ? (CHASSIS_LABELS[String(a.chassis_length)] ?? String(a.chassis_length)) : null;
  const r = has(a.roof_height) ? (ROOF_LABELS[String(a.roof_height)] ?? String(a.roof_height)) : null;
  if (c && r) return { label: "Şasi / Tavan", value: `${c} · ${r}` };
  if (c) return { label: "Şasi Boyu", value: c };
  if (r) return { label: "Tavan", value: r };
  return null;
}

// Elektrikli araçta menzil (yoksa batarya), diğerlerinde ortalama tüketim.
function consumptionOrRange(a: Attrs): Candidate {
  const fuel = String(a.fuel_type ?? "");
  const ev = fuel === "EV";
  if (!ev && has(a.fuel_consumption_l)) return { label: "Ort. Tüketim", value: `${a.fuel_consumption_l} L/100 km` };
  if (has(a.ev_range_km)) return { label: "Menzil", value: `${a.ev_range_km} km` };
  if ((ev || fuel === "PHEV" || fuel === "HYBRID") && has(a.battery_kwh)) return { label: "Batarya", value: `${a.battery_kwh} kWh` };
  return null;
}

// Pickup: 4×4 ise tipiyle ("4×4 · Part-time"), değilse çekiş tipi.
function pickupDrive(a: Attrs): Candidate {
  if (a.four_wd === true) {
    const t = has(a.four_wd_type) ? FOURWD_SHORT[String(a.four_wd_type)] : null;
    return { label: "Çekiş", value: t ? `4×4 · ${t}` : "4×4" };
  }
  if (has(a.drivetrain)) return { label: "Çekiş", value: DRIVETRAIN_LABELS[String(a.drivetrain)] ?? String(a.drivetrain) };
  if (a.four_wd === false) return { label: "Çekiş", value: "4×2" };
  return null;
}

const cab = (a: Attrs): Candidate =>
  has(a.cab_type) ? { label: "Kabin", value: CAB_LABELS[String(a.cab_type)] ?? String(a.cab_type) } : null;

function pick(a: Attrs, candidates: ((a: Attrs) => Candidate)[]): SpecItem[] {
  const out: SpecItem[] = [];
  for (const c of candidates) {
    const item = c(a);
    if (item) out.push(item);
    if (out.length === MAX_ITEMS) break;
  }
  return out;
}

export function buildKamyonetHeroSpecs(attrsInput: unknown): SpecItem[] {
  const a = (attrsInput ?? {}) as Attrs;
  const body = has(a.body_type) ? String(a.body_type) : null;

  if (body === "van" || body === "panelvan") {
    return pick(a, [cargo, payload, chassisRoof, power, consumptionOrRange, cargoLength, slidingDoors, tow]);
  }
  if (body === "pickup") {
    return pick(a, [payload, cab, pickupDrive, tow, power, bedLength, clearance]);
  }
  if (body === "minibus") {
    return pick(a, [seats, chassisRoof, power, consumptionOrRange, payload, slidingDoors]);
  }
  if (body === "minivan") {
    return pick(a, [seats, power, consumptionOrRange, boot, payload, slidingDoors]);
  }
  // Kasa tipi bilinmiyorsa: eski genel şerit.
  return pick(a, [
    power, payload,
    (x) => has(x.torque_nm) ? { label: "Tork", value: `${x.torque_nm} Nm` } : null,
    (x) => x.four_wd != null ? { label: "4×4", value: x.four_wd ? "Var" : "Yok" } : null,
    tow,
  ]);
}
