import { describe, expect, it } from "vitest";
import { buildEbikeHeroSpecs } from "./heroSpecsEbike";

const labels = (a: Record<string, unknown>) => buildEbikeHeroSpecs(a).map((i) => i.label);
const map = (a: Record<string, unknown>) => Object.fromEntries(buildEbikeHeroSpecs(a).map((i) => [i.label, i.value]));

describe("e-bisiklet hero şeridi", () => {
  it("katlanır: ağırlık, katlanmış ölçü, menzil, batarya, motor gücü — 5 kutu (Brompton)", () => {
    const a = {
      bike_type: "katlanabilir", motor_type: "hub-drive", motor_watt: 250, motor_torque_nm: 24, battery_wh: 345,
      range_km: 90, weight_kg: 13.8, folded_size: "64,5 × 60 × 32 cm",
    };
    expect(labels(a)).toEqual(["Ağırlık", "Katlanmış Ölçü", "Menzil", "Batarya", "Motor Gücü"]);
    expect(map(a)["Batarya"]).toBe("345 Wh");
    expect(map(a)["Ağırlık"]).toBe("13.8 kg");
  });
  it("katlanır: eksik veride yedek adaylar şeridi 5'e tamamlar", () => {
    const l = labels({ bike_type: "katlanabilir", motor_type: "hub-drive", motor_watt: 250, battery_wh: 300, motor_torque_nm: 24, gearbox: 4 });
    expect(l).toEqual(["Batarya", "Motor Gücü", "Motor Torku", "Motor Tipi", "Vites"]);
  });
  it("tip bilinmiyorsa/şehir: motor tipi, güç, batarya, menzil, ağırlık", () => {
    const a = { motor_type: "hub-drive", motor_watt: 250, battery_wh: 300, range_km: 60, weight_kg: 22 };
    expect(labels(a)).toEqual(["Motor Tipi", "Motor Gücü", "Batarya", "Menzil", "Ağırlık"]);
  });
  it("kargo: maks. yük öne çıkar", () => {
    expect(labels({ bike_type: "kargo", max_load_kg: 200, motor_watt: 250, battery_wh: 500 }).slice(0, 2)).toEqual(["Maks. Yük", "Motor Gücü"]);
  });
  it("mtb: tork ikinci sırada", () => {
    expect(labels({ bike_type: "mtb", motor_watt: 250, motor_torque_nm: 85, battery_wh: 625 }).slice(0, 3)).toEqual(["Motor Gücü", "Motor Torku", "Batarya"]);
  });
  it("en fazla 5 kutu; boş veri boş şerit", () => {
    const a = { bike_type: "katlanabilir", weight_kg: 13, folded_size: "x", range_km: 1, battery_wh: 1, motor_watt: 1, motor_torque_nm: 1, gearbox: 3, charge_hours: 3 };
    expect(buildEbikeHeroSpecs(a)).toHaveLength(5);
    expect(buildEbikeHeroSpecs({})).toEqual([]);
    expect(buildEbikeHeroSpecs(null)).toEqual([]);
  });
});
