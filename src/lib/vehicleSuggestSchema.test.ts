import { describe, expect, it } from "vitest";
import { vehicleSuggestSchema } from "./schemas";

const temel = {
  brandName: "Togg", modelName: "T10F", year: 2024, fuelType: "EV", categorySlug: "otomobil",
  scoreFiyat: 8, scoreKalite: 8, scorePerformans: 8, summaryText: "Gayet memnunum, günlük kullanımda sorun yok.",
};

describe("vehicleSuggestSchema.extendedData", () => {
  const dene = (extendedData: unknown) => vehicleSuggestSchema.safeParse({ ...temel, extendedData }).success;

  it.each([{ pros: 5 }, { pros: "hızlı" }, { cons: { a: 1 } }, { pros: [1] }, { pros: ["yok-boyle-bir-chip"] }, { pros: ["a", "b", "c", "d"] }])(
    "bozuk pros/cons reddedilir: %j", (v) => expect(dene(v)).toBe(false),
  );
  it("pros/cons içermeyen veya boş dizi olan ek veri geçer", () => {
    expect(dene({})).toBe(true);
    expect(dene({ pros: [], cons: [] })).toBe(true);
    expect(dene(null)).toBe(true);
  });
});

describe("vehicleSuggestSchema taban verisi", () => {
  it("geçerli taban veri kabul edilir (ret testlerinin boş yere geçmediğini doğrular)", () => {
    expect(vehicleSuggestSchema.safeParse(temel).success).toBe(true);
  });
});
