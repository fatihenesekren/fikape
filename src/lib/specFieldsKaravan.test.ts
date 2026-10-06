import { describe, expect, it } from "vitest";
import { buildSpecList } from "./buildSpecList";
import { SPEC_FIELDS, SPEC_GROUPS, getCrossFieldWarnings } from "./specFields";
import { KARAVAN_ALT_TIP_GRUBU, KARAVAN_ALT_TIPLERI } from "./vehicleTypes";

const gorunur = (attrs: Record<string, string>) =>
  (SPEC_FIELDS.karavan ?? []).filter((f) => !f.showIf || f.showIf(attrs)).map((f) => f.key);

describe("karavan alanları tipe göre", () => {
  it("çekme karavan: aks, çeki oku yükü, fren ve stabilizatör var; motor/yakıt/çekiş/koltuk yok", () => {
    const k = gorunur({ karavan_type: "cekme" });
    expect(k).toEqual(expect.arrayContaining(["axle_count", "nose_weight_kg", "brake_system", "has_stabilizer", "mro_kg", "tire_size", "fridge_l", "toilet_type"]));
    for (const x of ["engine_cc", "power_hp", "fuel_type", "drivetrain", "tank_l", "seat_belts", "pop_top"]) expect(k).not.toContain(x);
  });
  it("motorlu karavan: motor, yakıt, çekiş, depo, kemerli koltuk var; aks ve çeki oku yok", () => {
    const k = gorunur({ karavan_type: "motorlu" });
    expect(k).toEqual(expect.arrayContaining(["fuel_type", "engine_cc", "power_hp", "transmission", "drivetrain", "tank_l", "fuel_consumption_l", "seat_belts"]));
    for (const x of ["axle_count", "nose_weight_kg", "brake_system", "has_stabilizer", "pop_top"]) expect(k).not.toContain(x);
  });
  it("kamper van: motor alanları + yükselen çatı var; çekmeye özel alanlar yok", () => {
    const k = gorunur({ karavan_type: "kamper-van" });
    expect(k).toEqual(expect.arrayContaining(["pop_top", "engine_cc", "seat_belts"]));
    for (const x of ["axle_count", "nose_weight_kg", "has_stabilizer"]) expect(k).not.toContain(x);
  });
  it("tip seçilmemişse hepsi sorulur", () => {
    const k = gorunur({});
    expect(k).toEqual(expect.arrayContaining(["axle_count", "pop_top", "engine_cc"]));
  });
  it("her karavan alanı bir SPEC_GROUPS grubunda (yoksa formda görünmez)", () => {
    const grouped = new Set((SPEC_GROUPS.karavan ?? []).flatMap((g) => g.keys));
    for (const f of SPEC_FIELDS.karavan ?? []) expect(grouped, f.key).toContain(f.key);
    for (const k of grouped) expect((SPEC_FIELDS.karavan ?? []).map((f) => f.key), k).toContain(k);
  });
  it("alt tip grupları tüm alt tipleri kapsar ve tekrarsızdır", () => {
    const hepsi = Object.values(KARAVAN_ALT_TIP_GRUBU).flat();
    expect(new Set(hepsi).size).toBe(hepsi.length);
    expect(new Set(hepsi)).toEqual(new Set(KARAVAN_ALT_TIPLERI.map((o) => o.value)));
  });
});

describe("karavan çapraz uyarılar", () => {
  it("alt tip tipe uymuyorsa uyarır", () => {
    expect(getCrossFieldWarnings("karavan", { karavan_type: "cekme", karavan_alt_tip: "alkovenli" })).toHaveLength(1);
    expect(getCrossFieldWarnings("karavan", { karavan_type: "cekme", karavan_alt_tip: "touring" })).toHaveLength(0);
    expect(getCrossFieldWarnings("karavan", { karavan_type: "motorlu", karavan_alt_tip: "tam-entegre" })).toHaveLength(0);
  });
  it("MRO boştan küçük ya da azami ağırlıktan büyükse uyarır", () => {
    expect(getCrossFieldWarnings("karavan", { empty_weight_kg: "1020", mro_kg: "1000" })).toHaveLength(1);
    expect(getCrossFieldWarnings("karavan", { mro_kg: "1400", total_weight_kg: "1300" })).toHaveLength(1);
    expect(getCrossFieldWarnings("karavan", { empty_weight_kg: "1020", mro_kg: "1040", total_weight_kg: "1300" })).toHaveLength(0);
  });
  it("gövde toplam uzunluktan, iç uzunluk gövdeden uzun olamaz", () => {
    expect(getCrossFieldWarnings("karavan", { length_cm: "640", body_length_cm: "700" })).toHaveLength(1);
    expect(getCrossFieldWarnings("karavan", { body_length_cm: "504", interior_length_cm: "600" })).toHaveLength(1);
    expect(getCrossFieldWarnings("karavan", { length_cm: "640", body_length_cm: "504.5", interior_length_cm: "432.2" })).toHaveLength(0);
  });
  it("stabilizatör yalnız çekme karavanda", () => {
    expect(getCrossFieldWarnings("karavan", { karavan_type: "motorlu", has_stabilizer: "true" })).toHaveLength(1);
    expect(getCrossFieldWarnings("karavan", { karavan_type: "cekme", has_stabilizer: "true" })).toHaveLength(0);
  });
});

describe("karavan teknik özellik listesi", () => {
  const adria = {
    karavan_type: "cekme", karavan_alt_tip: "touring", berth: 4, chassis_brand: "AL-KO", axle_count: 1,
    length_cm: 640, body_length_cm: 504.5, interior_length_cm: 432.2, width_cm: 229.6, interior_width_cm: 217,
    exterior_height_cm: 258, height_cm: 195, empty_weight_kg: 1020, mro_kg: 1040, total_weight_kg: 1300, payload_kg: 260,
    nose_weight_kg: 100, tire_size: "185 R14 C", water_tank_l: 50, waste_water_tank_l: 20, fridge_l: 90,
    heating_type: "gazli", heater_model: "Truma S 3004", toilet_type: "kaset", has_shower: true,
  };
  it("Adria Altea örneği (çekme) listeye dökülür", () => {
    const m = Object.fromEntries(buildSpecList("karavan", adria).map((i) => [i.label, i.value]));
    expect(m["Tip"]).toBe("Çekme Karavan");
    expect(m["Alt Tip"]).toBe("Touring");
    expect(m["Uzunluk"]).toBe("640 cm");
    expect(m["Gövde Uzunluğu"]).toBe("504.5 cm");
    expect(m["Yürür Ağırlık (MRO)"]).toBe("1040 kg");
    expect(m["Çeki Oku Yükü"]).toBe("100 kg");
    expect(m["Aks Sayısı"]).toBe("1 aks");
    expect(m["Tuvalet"]).toBe("Kaset tipi");
    expect(m["Isıtıcı Modeli"]).toBe("Truma S 3004");
    expect(m["Buzdolabı"]).toBe("90 L");
    expect(m["Duş"]).toBe("Var");
  });
  it("çekme karavanda motor/yakıt alanları listede çıkmaz", () => {
    const l = buildSpecList("karavan", { ...adria, engine_cc: 2000, fuel_type: "DIESEL", seat_belts: 4 }).map((i) => i.label);
    for (const x of ["Motor", "Yakıt", "Emniyet Kemerli Koltuk"]) expect(l).not.toContain(x);
  });
  it("motorlu karavanda motor/yakıt/çekiş listede, çekmeye özel alanlar çıkmaz", () => {
    const m = Object.fromEntries(buildSpecList("karavan", {
      karavan_type: "motorlu", karavan_alt_tip: "yari-entegre", fuel_type: "DIESEL", engine_cc: 2287, power_hp: 140,
      transmission: "Manuel", drivetrain: "FWD", tank_l: 90, fuel_consumption_l: 11, seat_belts: 4, axle_count: 2, nose_weight_kg: 90,
    }).map((i) => [i.label, i.value]));
    expect(m["Yakıt"]).toBe("Dizel");
    expect(m["Çekiş"]).toBe("FWD (Önden Çekiş)");
    expect(m["Emniyet Kemerli Koltuk"]).toBe("4 adet");
    expect(m["Aks Sayısı"]).toBeUndefined();
    expect(m["Çeki Oku Yükü"]).toBeUndefined();
  });
  it("yükselen çatı yalnız kamper van'da listelenir", () => {
    const kamper = buildSpecList("karavan", { karavan_type: "kamper-van", pop_top: true }).map((i) => i.label);
    expect(kamper).toContain("Yükselen Çatı");
    expect(buildSpecList("karavan", { karavan_type: "motorlu", pop_top: true }).map((i) => i.label)).not.toContain("Yükselen Çatı");
  });
});
