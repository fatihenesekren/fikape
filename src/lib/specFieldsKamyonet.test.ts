import { describe, expect, it } from "vitest";
import { buildSpecList } from "./buildSpecList";
import { SPEC_FIELDS, SPEC_GROUPS, getCriticalFields, getCrossFieldWarnings } from "./specFields";

const gorunur = (attrs: Record<string, string>) =>
  (SPEC_FIELDS.kamyonet ?? []).filter((f) => !f.showIf || f.showIf(attrs)).map((f) => f.key);

describe("kamyonet alanları kasaya göre", () => {
  it("eski anlamsız alanlar kalktı", () => {
    const keys = (SPEC_FIELDS.kamyonet ?? []).map((f) => f.key);
    expect(keys).not.toContain("size_class");
    expect(keys).not.toContain("vehicle_class");
  });
  it("pickup: kabin var, kargo/koltuk yok", () => {
    const k = gorunur({ body_type: "pickup" });
    expect(k).toContain("cab_type");
    expect(k).not.toContain("cargo_m3");
    expect(k).not.toContain("seat_count");
  });
  it("van/panelvan: kargo hacmi + koltuk, kabin yok", () => {
    for (const b of ["van", "panelvan"]) {
      const k = gorunur({ body_type: b });
      expect(k).toContain("cargo_m3");
      expect(k).toContain("seat_count");
      expect(k).not.toContain("cab_type");
      expect(k).not.toContain("bed_length_mm");
      expect(k).toEqual(expect.arrayContaining(["chassis_length", "roof_height", "cargo_length_mm", "cargo_width_mm", "cargo_height_mm", "euro_pallets", "sliding_door", "sliding_door_count"]));
    }
  });
  it("minibüs: koltuk, şasi, tavan, kapı ve yükleme yüksekliği var; kargo m³ ve pickup alanları yok", () => {
    const k = gorunur({ body_type: "minibus" });
    expect(k).toEqual(expect.arrayContaining(["seat_count", "chassis_length", "roof_height", "sliding_door", "sliding_door_width_mm", "rear_door_width_mm", "loading_height_mm"]));
    expect(k).not.toContain("cargo_m3");
    expect(k).not.toContain("bed_length_mm");
    expect(k).not.toContain("boot_l");
    expect(getCriticalFields("kamyonet", null, "minibus")).toContain("seat_count");
  });
  it("camlı van: koltuk, bagaj, şasi, tavan, sürgülü kapı var; kargo m³ ve pickup alanları yok", () => {
    const k = gorunur({ body_type: "camli_van" });
    expect(k).toEqual(expect.arrayContaining(["seat_count", "boot_l", "chassis_length", "roof_height", "sliding_door"]));
    expect(k).not.toContain("cargo_m3");
    expect(k).not.toContain("bed_length_mm");
    expect(getCriticalFields("kamyonet", null, "camli_van")).toContain("seat_count");
  });
  it("camlı van: kasa etiketi ve spec listesi", () => {
    const m = Object.fromEntries(buildSpecList("kamyonet", { body_type: "camli_van", fuel_type: "DIESEL", seat_count: 6, boot_l: 3200, chassis_length: "kisa" }).map((i) => [i.label, i.value]));
    expect(m["Kasa"]).toBe("Camlı Van");
    expect(m["Şasi Boyu"]).toBe("Kısa");
    expect(m["Bagaj"]).toBe("3200 L");
  });
  it("minivan: şasi/tavan/yükleme yüksekliği yok", () => {
    const k = gorunur({ body_type: "minivan" });
    for (const x of ["chassis_length", "roof_height", "loading_height_mm"]) expect(k).not.toContain(x);
  });
  it("elektrik tüketimi yalnız saf EV'de; DC şarj gücü EV/PHEV/HYBRID'de", () => {
    expect(gorunur({ fuel_type: "EV" })).toEqual(expect.arrayContaining(["ev_consumption_kwh", "dc_charge_kw"]));
    expect(gorunur({ fuel_type: "PHEV" })).toContain("dc_charge_kw");
    expect(gorunur({ fuel_type: "PHEV" })).not.toContain("ev_consumption_kwh");
    expect(gorunur({ fuel_type: "DIESEL" })).not.toContain("dc_charge_kw");
  });
  it("AC şarj gücü EV'de görünür, dizelde gizli ve listeye dökülür", () => {
    expect(gorunur({ fuel_type: "EV" })).toContain("ac_charge_kw");
    expect(gorunur({ fuel_type: "DIESEL" })).not.toContain("ac_charge_kw");
    const m = Object.fromEntries(buildSpecList("kamyonet", { fuel_type: "EV", battery_kwh: 50, ac_charge_kw: 11 }).map((i) => [i.label, i.value]));
    expect(m["AC Maks. Şarj Gücü"]).toBe("11 kW");
  });
  it("Ford E-Transit minibüs örneği spec listesine dökülüyor", () => {
    const m = Object.fromEntries(buildSpecList("kamyonet", {
      fuel_type: "EV", body_type: "minibus", seat_count: 15, chassis_length: "uzun", roof_height: "orta",
      drivetrain: "RWD", battery_kwh: 68, ev_consumption_kwh: 31, dc_charge_kw: 115, charge_hours: 8.2,
      sliding_door: true, sliding_door_count: 1, sliding_door_width_mm: 1300, loading_height_mm: 720,
    }).map((i) => [i.label, i.value]));
    expect(m["Kasa"]).toBe("Minibüs");
    expect(m["Tavan"]).toBe("Orta Tavan");
    expect(m["Elektrik Tüketimi"]).toBe("31 kWh/100 km");
    expect(m["DC Maks. Şarj Gücü"]).toBe("115 kW");
    expect(m["Sürgülü Kapı"]).toBe("1 adet");
    expect(m["Koltuk Sayısı"]).toBe("15 kişi");
  });
  it("pickup: kasa ve arazi alanları var, van alanları yok", () => {
    const k = gorunur({ body_type: "pickup" });
    expect(k).toEqual(expect.arrayContaining(["bed_length_mm", "ground_clearance_mm", "four_wd_type", "diff_lock"]));
    expect(k).not.toContain("chassis_length");
    expect(k).not.toContain("cargo_length_mm");
    expect(k).not.toContain("sliding_door");
  });
  it("pickup: yaklaşma/uzaklaşma/rampa açıları var ve listeye dökülür; van'da yok", () => {
    const k = gorunur({ body_type: "pickup" });
    expect(k).toEqual(expect.arrayContaining(["approach_angle_deg", "departure_angle_deg", "ramp_angle_deg"]));
    expect(gorunur({ body_type: "van" })).not.toContain("approach_angle_deg");
    const m = Object.fromEntries(buildSpecList("kamyonet", { body_type: "pickup", approach_angle_deg: 30.5, departure_angle_deg: 24.2, ramp_angle_deg: 24 }).map((i) => [i.label, i.value]));
    expect(m["Yaklaşma Açısı"]).toBe("30.5°");
    expect(m["Uzaklaşma Açısı"]).toBe("24.2°");
    expect(m["Rampa Açısı"]).toBe("24°");
  });
  it("pickup 4×4 yoksa 4×4 tipi ve diferansiyel kilidi gizlenir", () => {
    const k = gorunur({ body_type: "pickup", four_wd: "false" });
    expect(k).not.toContain("four_wd_type");
    expect(k).not.toContain("diff_lock");
  });
  it("elektrikli: batarya/menzil görünür, motor cc/depo/tüketim gizli", () => {
    const k = gorunur({ fuel_type: "EV" });
    expect(k).toEqual(expect.arrayContaining(["battery_kwh", "ev_range_km", "charge_hours"]));
    for (const x of ["engine_cc", "tank_l", "fuel_consumption_l"]) expect(k).not.toContain(x);
    const d = gorunur({ fuel_type: "DIESEL" });
    expect(d).not.toContain("ev_range_km");
    expect(d).toEqual(expect.arrayContaining(["engine_cc", "tank_l", "fuel_consumption_l"]));
  });
  it("EV kritik alanı ev_range_km ve formda gerçekten var", () => {
    const crit = getCriticalFields("kamyonet", "EV", "van");
    expect(crit).toContain("ev_range_km");
    const keys = (SPEC_FIELDS.kamyonet ?? []).map((f) => f.key);
    for (const c of crit) expect(keys).toContain(c);
  });
  it("her kamyonet alanı bir SPEC_GROUPS grubunda (yoksa formda görünmez)", () => {
    const grouped = new Set((SPEC_GROUPS.kamyonet ?? []).flatMap((g) => g.keys));
    for (const f of SPEC_FIELDS.kamyonet ?? []) expect(grouped, f.key).toContain(f.key);
    for (const k of grouped) expect((SPEC_FIELDS.kamyonet ?? []).map((f) => f.key), k).toContain(k);
  });
  it("çapraz uyarılar: brüt<boş ve FWD+4×4", () => {
    expect(getCrossFieldWarnings("kamyonet", { curb_weight_kg: "2000", gvw_kg: "1500" })).toHaveLength(1);
    expect(getCrossFieldWarnings("kamyonet", { four_wd: "true", drivetrain: "FWD" })).toHaveLength(1);
    expect(getCrossFieldWarnings("kamyonet", { four_wd: "false", drivetrain: "AWD" })).toHaveLength(1);
    expect(getCrossFieldWarnings("kamyonet", { curb_weight_kg: "1544", gvw_kg: "2475", four_wd: "false", drivetrain: "FWD" })).toHaveLength(0);
  });
  it("minivan: koltuk + bagaj + sürgülü kapı, kargo hacmi yok", () => {
    const k = gorunur({ body_type: "minivan" });
    expect(k).toEqual(expect.arrayContaining(["seat_count", "boot_l", "sliding_door"]));
    expect(k).not.toContain("cargo_m3");
  });
  it("kasa seçilmemişse hepsi sorulur (Gemini istemi için)", () => {
    const k = gorunur({});
    expect(k).toEqual(expect.arrayContaining(["cab_type", "cargo_m3", "seat_count", "boot_l", "sliding_door", "chassis_length", "bed_length_mm"]));
  });
  it("Berlingo Van 1.5 BlueHDI örneği spec listesine dökülüyor", () => {
    const items = buildSpecList("kamyonet", {
      fuel_type: "DIESEL", body_type: "van", transmission: "Manuel", gearbox: 6, drivetrain: "FWD", four_wd: false,
      engine_cc: 1499, power_hp: 130, torque_nm: 300, zero_to_100: 11.2, top_speed_kmh: 181, fuel_consumption_l: 5.8,
      tank_l: 50, length_mm: 4753, width_mm: 1848, height_mm: 1880, curb_weight_kg: 1544, payload_kg: 931,
      seat_count: 3, cargo_m3: 4.4, chassis_length: "uzun", tire_size: "205/60 R16",
    });
    const m = Object.fromEntries(items.map((i) => [i.label, i.value]));
    expect(m["Şasi Boyu"]).toBe("Uzun");
    expect(m["Çekiş"]).toBe("FWD (Önden Çekiş)");
    expect(m["Ort. Tüketim"]).toBe("5.8 L/100 km");
    expect(m["Boş Ağırlık"]).toBe("1544 kg");
    expect(m["Lastik Ölçüsü"]).toBe("205/60 R16");
  });
  it("kasa minibüse çevrilince eski kargo m³ listede görünmez", () => {
    const labels = (b: string) => buildSpecList("kamyonet", { body_type: b, cargo_m3: 11 }).map((i) => i.label);
    expect(labels("minibus")).not.toContain("Kargo Hacmi");
    expect(labels("van")).toContain("Kargo Hacmi");
  });
  it("EV kamyonette motor cc ve depo gösterilmez, batarya gösterilir", () => {
    const m = Object.fromEntries(buildSpecList("kamyonet", { fuel_type: "EV", engine_cc: 1000, tank_l: 40, battery_kwh: 50, ev_range_km: 280 }).map((i) => [i.label, i.value]));
    expect(m["Motor"]).toBeUndefined();
    expect(m["Yakıt Dep."]).toBeUndefined();
    expect(m["Batarya"]).toBe("50 kWh");
  });
  it("kritik alanlar kasaya göre", () => {
    expect(getCriticalFields("kamyonet", null, "van")).toContain("cargo_m3");
    expect(getCriticalFields("kamyonet", null, "minivan")).toContain("seat_count");
    expect(getCriticalFields("kamyonet", null, "pickup")).toEqual(["body_type", "engine_cc", "power_hp"]);
  });
});
