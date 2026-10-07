// Araç sayfası üst şeridi (hero spec strip) — e-bisiklet kategorisi, bisiklet tipine göre
// 5 öne çıkan özellik. Aday listesi önem sırasıyla verilir; verisi olmayan aday atlanır,
// sıradaki öne geçer (şerit boş kutu göstermez, mümkünse hep 5 kutu dolar).
import { EBIKE_MOTOR_TYPES, toLabelMap } from "@/lib/vehicleTypes";
import type { SpecItem } from "@/lib/buildSpecList";

const MOTOR_LABELS = toLabelMap(EBIKE_MOTOR_TYPES);
const MAX_ITEMS = 5;

type Attrs = Record<string, unknown>;
type Candidate = SpecItem | null;

const has = (v: unknown) => v !== undefined && v !== null && v !== "" && v !== 0;

const motorType = (a: Attrs): Candidate => has(a.motor_type) ? { label: "Motor Tipi", value: MOTOR_LABELS[String(a.motor_type)] ?? String(a.motor_type) } : null;
const motorPower = (a: Attrs): Candidate => has(a.motor_watt) ? { label: "Motor Gücü", value: `${a.motor_watt} W` } : null;
const torque = (a: Attrs): Candidate => has(a.motor_torque_nm) ? { label: "Motor Torku", value: `${a.motor_torque_nm} Nm` } : null;
const battery = (a: Attrs): Candidate => has(a.battery_wh) ? { label: "Batarya", value: `${a.battery_wh} Wh` } : null;
const range = (a: Attrs): Candidate => has(a.range_km) ? { label: "Menzil", value: `${a.range_km} km` } : null;
const weight = (a: Attrs): Candidate => has(a.weight_kg) ? { label: "Ağırlık", value: `${a.weight_kg} kg` } : null;
const folded = (a: Attrs): Candidate => has(a.folded_size) ? { label: "Katlanmış Ölçü", value: String(a.folded_size) } : null;
const maxLoad = (a: Attrs): Candidate => has(a.max_load_kg) ? { label: "Maks. Yük", value: `${a.max_load_kg} kg` } : null;
const topSpeed = (a: Attrs): Candidate => has(a.max_speed_kmh) ? { label: "Maks. Hız", value: `${a.max_speed_kmh} km/s` } : null;
const gears = (a: Attrs): Candidate => has(a.gearbox) ? { label: "Vites", value: `${a.gearbox} vites` } : null;
const charge = (a: Attrs): Candidate => has(a.charge_hours) ? { label: "Tam Şarj", value: `~${a.charge_hours} saat` } : null;
const weightNoBattery = (a: Attrs): Candidate => has(a.weight_no_battery_kg) ? { label: "Bataryasız Ağırlık", value: `${a.weight_no_battery_kg} kg` } : null;
const levels = (a: Attrs): Candidate => has(a.support_levels) ? { label: "Destek Seviyesi", value: `${a.support_levels} seviye` } : null;
const removable = (a: Attrs): Candidate => a.removable_battery === true ? { label: "Çıkarılabilir Batarya", value: "Var" } : null;

function pick(a: Attrs, candidates: ((a: Attrs) => Candidate)[]): SpecItem[] {
  const out: SpecItem[] = [];
  for (const c of candidates) {
    const item = c(a);
    if (item && !out.some((o) => o.label === item.label)) out.push(item);
    if (out.length === MAX_ITEMS) break;
  }
  return out;
}

export function buildEbikeHeroSpecs(attrsInput: unknown): SpecItem[] {
  const a = (attrsInput ?? {}) as Attrs;
  const type = has(a.bike_type) ? String(a.bike_type) : null;

  // Katlanır: en çok merak edilenler taşınabilirlik (ağırlık, katlanmış ölçü) ve menzil.
  if (type === "katlanabilir") {
    return pick(a, [weight, folded, range, battery, motorPower, torque, weightNoBattery, motorType, gears, charge, removable]);
  }
  // Kargo: yük kapasitesi ve motor gücü ayırt edicidir.
  if (type === "kargo") {
    return pick(a, [maxLoad, motorPower, torque, battery, range, weight, motorType, topSpeed, gears]);
  }
  // MTB: tork ve güç öne çıkar.
  if (type === "mtb") {
    return pick(a, [motorPower, torque, battery, range, weight, motorType, gears, topSpeed, charge]);
  }
  // Şehir / yol / tip bilinmiyor: motor, batarya, menzil, ağırlık.
  return pick(a, [motorType, motorPower, battery, range, weight, torque, gears, topSpeed, charge, levels, removable]);
}
