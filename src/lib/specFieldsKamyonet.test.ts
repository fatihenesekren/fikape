import { describe, expect, it } from "vitest";
import { SPEC_FIELDS, getCriticalFields } from "./specFields";

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
      expect(k).not.toContain("sliding_door");
    }
  });
  it("minivan: koltuk + bagaj + sürgülü kapı, kargo hacmi yok", () => {
    const k = gorunur({ body_type: "minivan" });
    expect(k).toEqual(expect.arrayContaining(["seat_count", "boot_l", "sliding_door"]));
    expect(k).not.toContain("cargo_m3");
  });
  it("kasa seçilmemişse hepsi sorulur (Gemini istemi için)", () => {
    const k = gorunur({});
    expect(k).toEqual(expect.arrayContaining(["cab_type", "cargo_m3", "seat_count", "boot_l", "sliding_door"]));
  });
  it("kritik alanlar kasaya göre", () => {
    expect(getCriticalFields("kamyonet", null, "van")).toContain("cargo_m3");
    expect(getCriticalFields("kamyonet", null, "minivan")).toContain("seat_count");
    expect(getCriticalFields("kamyonet", null, "pickup")).toEqual(["body_type", "engine_cc", "power_hp"]);
  });
});
