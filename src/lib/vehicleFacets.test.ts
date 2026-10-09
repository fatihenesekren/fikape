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
  it("diğer kategorilerin facet'leri değişmedi (otomobil hâlâ kapsam kapılı)", () => {
    const oto = facetGroupsForCategory("otomobil");
    expect(oto.map((g) => g.key)).toEqual(["yakit", "govde", "segment"]);
    expect(oto.every((g) => g.alwaysShow === undefined)).toBe(true);
  });
});

describe("karavan facet'leri", () => {
  const groups = facetGroupsForCategory("karavan");
  it("5 grup, hepsi her zaman görünür ve Belirtilmemiş taşır", () => {
    expect(groups.map((g) => g.key)).toEqual(["tip", "yatak", "uzunluk", "agirlik", "banyo"]);
    for (const g of groups) {
      expect(g.alwaysShow).toBe(true);
      expect(g.options[g.options.length - 1].value).toBe("na");
    }
  });
  it("kovalar sınır değerlerde doğru", () => {
    expect(productMatchesFacets({ berth: 4 }, groups, { yatak: ["3-4"] })).toBe(true);
    expect(productMatchesFacets({ length_cm: 600 }, groups, { uzunluk: ["0-600"] })).toBe(true);
    expect(productMatchesFacets({ length_cm: 832.5 }, groups, { uzunluk: ["801"] })).toBe(true);
    expect(productMatchesFacets({ total_weight_kg: 3500 }, groups, { agirlik: ["1301-3500"] })).toBe(true);
    expect(productMatchesFacets({ total_weight_kg: 4800 }, groups, { agirlik: ["3501"] })).toBe(true);
  });
  it("banyo: var / yok / belirtilmemiş ayrışır", () => {
    expect(productMatchesFacets({ has_bathroom: true }, groups, { banyo: ["var"] })).toBe(true);
    expect(productMatchesFacets({ has_bathroom: false }, groups, { banyo: ["yok"] })).toBe(true);
    expect(productMatchesFacets({}, groups, { banyo: ["na"] })).toBe(true);
    expect(productMatchesFacets({ has_bathroom: false }, groups, { banyo: ["na"] })).toBe(false);
  });
});

describe("e-scooter facet'leri", () => {
  const groups = facetGroupsForCategory("e-scooter");
  it("5 grup, hepsi her zaman görünür ve Belirtilmemiş taşır", () => {
    expect(groups.map((g) => g.key)).toEqual(["guc", "hiz", "menzil", "batarya", "katlan"]);
    for (const g of groups) {
      expect(g.alwaysShow).toBe(true);
      expect(g.options[g.options.length - 1].value).toBe("na");
    }
  });
  it("kovalar: 13 kW'lık güç ve 130 km/s'lik hız en üst kovaya girer", () => {
    expect(productMatchesFacets({ motor_watt: 13000 }, groups, { guc: ["2001"] })).toBe(true);
    expect(productMatchesFacets({ motor_watt: 500 }, groups, { guc: ["0-500"] })).toBe(true);
    expect(productMatchesFacets({ max_speed_kmh: 25 }, groups, { hiz: ["0-25"] })).toBe(true);
    expect(productMatchesFacets({ max_speed_kmh: 130 }, groups, { hiz: ["46"] })).toBe(true);
  });
  it("katlanabilir: evet / hayır / belirtilmemiş birbirinden ayrılır", () => {
    expect(productMatchesFacets({ foldable: true }, groups, { katlan: ["evet"] })).toBe(true);
    expect(productMatchesFacets({ foldable: false }, groups, { katlan: ["hayir"] })).toBe(true);
    expect(productMatchesFacets({ foldable: false }, groups, { katlan: ["na"] })).toBe(false);
    expect(productMatchesFacets({}, groups, { katlan: ["na"] })).toBe(true);
  });
});
