import { describe, expect, it } from "vitest";
import { buildSpecList } from "./buildSpecList";
import { SPEC_FIELDS, SPEC_GROUPS } from "./specFields";

const gorunur = (attrs: Record<string, string>) =>
  (SPEC_FIELDS["e-bisiklet"] ?? []).filter((f) => !f.showIf || f.showIf(attrs)).map((f) => f.key);

describe("e-bisiklet alanları", () => {
  it("genişletilmiş alanlar tanımlı", () => {
    const keys = (SPEC_FIELDS["e-bisiklet"] ?? []).map((f) => f.key);
    expect(keys).toEqual(expect.arrayContaining([
      "motor_model", "motor_torque_nm", "support_levels", "start_assist", "walk_assist", "battery_voltage_v",
      "weight_no_battery_kg", "max_load_kg", "folded_size", "frame_material", "fork_material", "suspension",
      "gear_type", "wheel_size", "tire_size", "brake_type", "has_rack", "has_mudguards", "has_lights", "display", "has_gps", "app_name",
    ]));
    expect(keys.length).toBeGreaterThanOrEqual(30);
  });
  it("her alan bir grupta ve bir kez yer alır (grup dışı alan formda görünmez)", () => {
    const keys = (SPEC_FIELDS["e-bisiklet"] ?? []).map((f) => f.key);
    const grupKeys = (SPEC_GROUPS["e-bisiklet"] ?? []).flatMap((g) => g.keys);
    expect([...grupKeys].sort()).toEqual([...keys].sort());
    expect(new Set(keys).size).toBe(keys.length);
  });
  it("katlanmış ölçü yalnız katlanır (ya da tipi boş) bisikletlerde sorulur", () => {
    expect(gorunur({ bike_type: "katlanabilir" })).toContain("folded_size");
    expect(gorunur({})).toContain("folded_size");
    expect(gorunur({ bike_type: "mtb" })).not.toContain("folded_size");
  });
  it("liste: yeni alanlar etiketli ve birimli gösterilir", () => {
    const l = Object.fromEntries(buildSpecList("e-bisiklet", {
      bike_type: "katlanabilir", battery_wh: 345, battery_voltage_v: 36, motor_torque_nm: 24, support_levels: 3,
      start_assist: true, walk_assist: true, weight_kg: 13.8, weight_no_battery_kg: 10.5, folded_size: "64,5 × 60 × 32 cm",
      frame_material: "titanyum", has_lights: true, has_rack: false, app_name: "Brompton Electric App",
    }).map((i) => [i.label, i.value]));
    expect(l["Batarya"]).toBe("345 Wh");
    expect(l["Batarya Gerilimi"]).toBe("36 V");
    expect(l["Motor Torku"]).toBe("24 Nm");
    expect(l["Destek Seviyesi"]).toBe("3 seviye");
    expect(l["Kalkış Desteği"]).toBe("Var");
    expect(l["Yürüme Desteği"]).toBe("Var");
    expect(l["Ağırlık"]).toBe("13.8 kg");
    expect(l["Bataryasız Ağırlık"]).toBe("10.5 kg");
    expect(l["Katlanmış Ölçü"]).toBe("64,5 × 60 × 32 cm");
    expect(l["Kadro Malzemesi"]).toBe("Titanyum");
    expect(l["Entegre Aydınlatma"]).toBe("Var");
    expect(l["Bagaj Taşıyıcı"]).toBe("Yok");
    expect(l["Mobil Uygulama"]).toBe("Brompton Electric App");
  });
  it("boş alanlar listede çıkmaz", () => {
    expect(buildSpecList("e-bisiklet", {})).toEqual([]);
  });
});
