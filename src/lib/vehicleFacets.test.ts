import { describe, expect, it } from "vitest";
import { facetGroupsForCategory, productMatchesFacets } from "./vehicleFacets";

describe("e-bisiklet facet'leri", () => {
  const groups = facetGroupsForCategory("e-bisiklet");
  it("5 grup, hepsi her zaman görünür ve 'Belirtilmemiş' seçeneği taşır", () => {
    expect(groups.map((g) => g.key)).toEqual(["tip", "motor", "guc", "batarya", "menzil"]);
    for (const g of groups) {
      expect(g.alwaysShow).toBe(true);
      expect(g.options[g.options.length - 1]).toMatchObject({ value: "na", label: "Belirtilmemiş" });
    }
  });
  it("Belirtilmemiş yalnız boş alanlı kaydı yakalar", () => {
    expect(productMatchesFacets({}, groups, { batarya: ["na"] })).toBe(true);
    expect(productMatchesFacets({ battery_wh: 360 }, groups, { batarya: ["na"] })).toBe(false);
  });
  it("kovalar sınır değerlerde doğru", () => {
    expect(productMatchesFacets({ battery_wh: 400 }, groups, { batarya: ["0-400"] })).toBe(true);
    expect(productMatchesFacets({ battery_wh: 401 }, groups, { batarya: ["401-600"] })).toBe(true);
    expect(productMatchesFacets({ motor_watt: 250 }, groups, { guc: ["0-250"] })).toBe(true);
    expect(productMatchesFacets({ motor_type: "mid-drive" }, groups, { motor: ["mid"] })).toBe(true);
    expect(productMatchesFacets({ range_km: 70 }, groups, { menzil: ["41-70"] })).toBe(true);
  });
  it("grup içi VEYA: seçili iki seçenekten biri yeter", () => {
    expect(productMatchesFacets({ battery_wh: 360 }, groups, { batarya: ["na", "0-400"] })).toBe(true);
  });
  it("diğer kategorilerin facet'leri değişmedi (e-scooter hâlâ kapsam kapılı)", () => {
    const es = facetGroupsForCategory("e-scooter");
    expect(es.map((g) => g.key)).toEqual(["guc"]);
    expect(es[0].alwaysShow).toBeUndefined();
  });
});
