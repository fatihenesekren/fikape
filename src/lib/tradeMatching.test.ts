import { describe, it, expect } from "vitest";
import { matchesWant, isMutualMatch, type WantCriteria, type VehicleFacts } from "./tradeMatching";

const baseWant: WantCriteria = {
  wantCategoryId: null,
  wantBrandId: null,
  wantLocationScope: "NATIONWIDE",
  wantDamageStatuses: [],
  city: "İstanbul",
};

const baseVehicle: VehicleFacts = {
  categoryId: 1,
  brandId: 10,
  city: "İstanbul",
  damageStatus: null,
};

describe("matchesWant", () => {
  it("boş kategori/marka her şeyi kabul eder", () => {
    expect(matchesWant(baseWant, baseVehicle)).toBe(true);
  });

  it("kategori belirtilmişse birebir eşleşmeli", () => {
    expect(matchesWant({ ...baseWant, wantCategoryId: 1 }, baseVehicle)).toBe(true);
    expect(matchesWant({ ...baseWant, wantCategoryId: 2 }, baseVehicle)).toBe(false);
  });

  it("marka belirtilmişse birebir eşleşmeli", () => {
    expect(matchesWant({ ...baseWant, wantBrandId: 10 }, baseVehicle)).toBe(true);
    expect(matchesWant({ ...baseWant, wantBrandId: 99 }, baseVehicle)).toBe(false);
  });

  it("SAME_CITY farklı şehirde reddeder", () => {
    const want: WantCriteria = { ...baseWant, wantLocationScope: "SAME_CITY", city: "Ankara" };
    expect(matchesWant(want, baseVehicle)).toBe(false);
    expect(matchesWant(want, { ...baseVehicle, city: "Ankara" })).toBe(true);
  });

  it("SAME_REGION gerçek bölge verisi olmadığı için lenient (NATIONWIDE gibi) davranır", () => {
    const want: WantCriteria = { ...baseWant, wantLocationScope: "SAME_REGION", city: "Ankara" };
    expect(matchesWant(want, { ...baseVehicle, city: "İzmir" })).toBe(true);
  });

  it("hasar durumu listesi boşsa tümünü kabul eder", () => {
    expect(matchesWant({ ...baseWant, wantDamageStatuses: [] }, { ...baseVehicle, damageStatus: "HEAVY" })).toBe(true);
  });

  it("hasar durumu belirtilmişse listede olmalı", () => {
    const want: WantCriteria = { ...baseWant, wantDamageStatuses: ["NONE", "DAMAGED"] };
    expect(matchesWant(want, { ...baseVehicle, damageStatus: "NONE" })).toBe(true);
    expect(matchesWant(want, { ...baseVehicle, damageStatus: "HEAVY" })).toBe(false);
  });

  it("aday hasar durumunu hiç beyan etmemişse (null) dışlanmaz", () => {
    const want: WantCriteria = { ...baseWant, wantDamageStatuses: ["NONE"] };
    expect(matchesWant(want, { ...baseVehicle, damageStatus: null })).toBe(true);
  });
});

describe("isMutualMatch", () => {
  it("her iki yön de uyuyorsa true döner", () => {
    const a = { want: baseWant, vehicle: baseVehicle };
    const b = { want: baseWant, vehicle: baseVehicle };
    expect(isMutualMatch(a, b)).toBe(true);
  });

  it("tek yön uymuyorsa false döner", () => {
    const a = { want: { ...baseWant, wantCategoryId: 999 }, vehicle: baseVehicle };
    const b = { want: baseWant, vehicle: baseVehicle };
    expect(isMutualMatch(a, b)).toBe(false);
  });
});
