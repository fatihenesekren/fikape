import { describe, expect, it } from "vitest";
import { buildKamyonetHeroSpecs } from "./heroSpecsKamyonet";

const labels = (a: Record<string, unknown>) => buildKamyonetHeroSpecs(a).map((i) => i.label);
const map = (a: Record<string, unknown>) => Object.fromEntries(buildKamyonetHeroSpecs(a).map((i) => [i.label, i.value]));

describe("kamyonet hero şeridi", () => {
  it("van: kargo, yük, şasi/tavan (tek kutu), güç, tüketim — en fazla 5", () => {
    const a = {
      body_type: "van", fuel_type: "DIESEL", cargo_m3: 4.4, payload_kg: 931, chassis_length: "uzun", roof_height: "yuksek",
      power_hp: 130, fuel_consumption_l: 5.8, torque_nm: 300, cargo_length_mm: 2000,
    };
    expect(labels(a)).toEqual(["Kargo Hacmi", "Yük Kapasitesi", "Şasi / Tavan", "Güç", "Ort. Tüketim"]);
    expect(map(a)["Şasi / Tavan"]).toBe("Uzun · Yüksek Tavan");
  });
  it("van: eksik veri atlanır, yedek aday öne geçer", () => {
    const l = labels({ body_type: "panelvan", fuel_type: "DIESEL", payload_kg: 1000, power_hp: 100, cargo_length_mm: 2500, sliding_door_count: 2 });
    expect(l).toEqual(["Yük Kapasitesi", "Güç", "Yük Boyu", "Sürgülü Kapı"]);
  });
  it("elektrikli van: tüketim yerine menzil, yoksa batarya", () => {
    expect(labels({ body_type: "van", fuel_type: "EV", fuel_consumption_l: 5, ev_range_km: 250 })).toEqual(["Menzil"]);
    expect(map({ body_type: "van", fuel_type: "EV", battery_kwh: 68 })["Batarya"]).toBe("68 kWh");
  });
  it("elektrikli van: eksik veride batarya, DC şarj, 0–100 yedek olarak şeridi doldurur (E-Doblo)", () => {
    const a = { body_type: "van", fuel_type: "EV", cargo_m3: 3.3, power_hp: 136, ev_range_km: 322, battery_kwh: 50, dc_charge_kw: 100, zero_to_100: 11.2, top_speed_kmh: 135 };
    expect(labels(a)).toEqual(["Kargo Hacmi", "Güç", "Menzil", "Batarya", "DC Şarj"]);
  });
  it("elektrikli yedekler dizelde çıkmaz; batarya iki kez yazılmaz", () => {
    expect(labels({ body_type: "van", fuel_type: "DIESEL", power_hp: 100, battery_kwh: 50, dc_charge_kw: 100, zero_to_100: 11 })).toEqual(["Güç"]);
    expect(labels({ body_type: "van", fuel_type: "EV", battery_kwh: 50 })).toEqual(["Batarya"]);
  });
  it("pickup: yük, kabin, çekiş tipi, çekme, güç", () => {
    const a = { body_type: "pickup", payload_kg: 1100, cab_type: "cift_kabin", four_wd: true, four_wd_type: "part_time", tow_capacity_kg: 3500, power_hp: 204, torque_nm: 500 };
    expect(labels(a)).toEqual(["Yük Kapasitesi", "Kabin", "Çekiş", "Çekme Kapasitesi", "Güç"]);
    expect(map(a)["Çekiş"]).toBe("4×4 · Part-time");
    expect(map(a)["Kabin"]).toBe("Çift Kabin");
  });
  it("pickup: 4×4 değilse 4×2; tork yalnız yedek aday olarak girer", () => {
    const m = map({ body_type: "pickup", four_wd: false, torque_nm: 400 });
    expect(m["Çekiş"]).toBe("4×2");
    expect(m["Tork"]).toBe("400 Nm");
    // asıl adaylar doluyken tork şeride girmez
    const dolu = map({ body_type: "pickup", payload_kg: 1000, cab_type: "cift_kabin", four_wd: true, tow_capacity_kg: 3000, power_hp: 150, torque_nm: 400 });
    expect(dolu["Tork"]).toBeUndefined();
  });
  it("pickup: yük/çekme/kasa verisi yoksa yedeklerle 5 kutuya tamamlanır (VW Transporter pikap)", () => {
    const a = { body_type: "pickup", fuel_type: "DIESEL", cab_type: "cift_kabin", drivetrain: "FWD", four_wd: false, power_hp: 150, torque_nm: 340, fuel_consumption_l: 5.9, zero_to_100: 9.3, top_speed_kmh: 204 };
    expect(labels(a)).toEqual(["Kabin", "Çekiş", "Güç", "Tork", "Ort. Tüketim"]);
  });
  it("elektrikli pickup: tüketim yerine menzil yedeği", () => {
    const l = labels({ body_type: "pickup", fuel_type: "EV", cab_type: "cift_kabin", drivetrain: "FWD", four_wd: false, power_hp: 207, torque_nm: 339, ev_range_km: 438 });
    expect(l).toEqual(["Kabin", "Çekiş", "Güç", "Tork", "Menzil"]);
  });
  it("minibüs: koltuk, şasi/tavan, güç, menzil, yük", () => {
    const a = { body_type: "minibus", fuel_type: "EV", seat_count: 15, chassis_length: "uzun", roof_height: "orta", power_hp: 269, battery_kwh: 68, payload_kg: 1636 };
    expect(labels(a)).toEqual(["Koltuk Sayısı", "Şasi / Tavan", "Güç", "Batarya", "Yük Kapasitesi"]);
    expect(map(a)["Koltuk Sayısı"]).toBe("15 kişi");
  });
  it("camlı van: koltuk, şasi, güç, tüketim, bagaj", () => {
    const a = { body_type: "camli_van", fuel_type: "DIESEL", seat_count: 6, chassis_length: "kisa", power_hp: 150, fuel_consumption_l: 6.6, boot_l: 3200, payload_kg: 1220 };
    expect(labels(a)).toEqual(["Koltuk Sayısı", "Şasi Boyu", "Güç", "Ort. Tüketim", "Bagaj"]);
  });
  it("minivan: koltuk, güç, tüketim, bagaj", () => {
    expect(labels({ body_type: "minivan", fuel_type: "DIESEL", seat_count: 7, power_hp: 130, fuel_consumption_l: 5.5, boot_l: 700, chassis_length: "uzun" }))
      .toEqual(["Koltuk Sayısı", "Güç", "Ort. Tüketim", "Bagaj"]);
  });
  it("kasa bilinmiyorsa eski genel şerit", () => {
    expect(labels({ power_hp: 100, payload_kg: 800, torque_nm: 250, four_wd: false })).toEqual(["Güç", "Yük Kapasitesi", "Tork", "4×4"]);
  });
  it("boş veri → boş şerit", () => {
    expect(buildKamyonetHeroSpecs({ body_type: "van" })).toEqual([]);
    expect(buildKamyonetHeroSpecs(null)).toEqual([]);
  });
});
