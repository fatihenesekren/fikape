import { describe, it, expect } from "vitest";
import { matchesWant, isMutualMatch, type WantCriteria, type VehicleFacts } from "./tradeMatching";

const baseWant: WantCriteria = {
  wantCategoryId: null,
  wantBrandId: null,
  wantLocationScope: "NATIONWIDE",
  wantDamageStatuses: [],
  city: "İstanbul",
  wantYearMin: null,
  wantYearMax: null,
  wantKmMin: null,
  wantKmMax: null,
  wantFuelTypes: [],
  wantTransmissions: [],
};

const baseVehicle: VehicleFacts = {
  categoryId: 1,
  brandId: 10,
  city: "İstanbul",
  damageStatus: null,
  year: 2020,
  km: 50000,
  fuelType: "GASOLINE",
  transmission: "Manuel",
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

  it("yıl aralığı dışındaysa reddeder, içindeyse kabul eder", () => {
    const want: WantCriteria = { ...baseWant, wantYearMin: 2018, wantYearMax: 2022 };
    expect(matchesWant(want, { ...baseVehicle, year: 2020 })).toBe(true);
    expect(matchesWant(want, { ...baseVehicle, year: 2015 })).toBe(false);
    expect(matchesWant(want, { ...baseVehicle, year: 2023 })).toBe(false);
  });

  it("aday yılını hiç beyan etmemişse (null) dışlanmaz", () => {
    const want: WantCriteria = { ...baseWant, wantYearMin: 2018 };
    expect(matchesWant(want, { ...baseVehicle, year: null })).toBe(true);
  });

  it("km aralığı dışındaysa reddeder, içindeyse kabul eder", () => {
    const want: WantCriteria = { ...baseWant, wantKmMin: 10000, wantKmMax: 60000 };
    expect(matchesWant(want, { ...baseVehicle, km: 50000 })).toBe(true);
    expect(matchesWant(want, { ...baseVehicle, km: 5000 })).toBe(false);
    expect(matchesWant(want, { ...baseVehicle, km: 100000 })).toBe(false);
  });

  it("aday km'sini hiç beyan etmemişse (null) dışlanmaz", () => {
    const want: WantCriteria = { ...baseWant, wantKmMax: 30000 };
    expect(matchesWant(want, { ...baseVehicle, km: null })).toBe(true);
  });

  it("yakıt tipi listesi boşsa tümünü kabul eder, doluysa listede olmalı", () => {
    expect(matchesWant(baseWant, { ...baseVehicle, fuelType: "DIESEL" })).toBe(true);
    const want: WantCriteria = { ...baseWant, wantFuelTypes: ["GASOLINE", "HYBRID"] };
    expect(matchesWant(want, { ...baseVehicle, fuelType: "GASOLINE" })).toBe(true);
    expect(matchesWant(want, { ...baseVehicle, fuelType: "DIESEL" })).toBe(false);
    expect(matchesWant(want, { ...baseVehicle, fuelType: null })).toBe(true);
  });

  it("vites tipi listesi boşsa tümünü kabul eder, doluysa listede olmalı", () => {
    const want: WantCriteria = { ...baseWant, wantTransmissions: ["Otomatik"] };
    expect(matchesWant(want, { ...baseVehicle, transmission: "Otomatik" })).toBe(true);
    expect(matchesWant(want, { ...baseVehicle, transmission: "Manuel" })).toBe(false);
    expect(matchesWant(want, { ...baseVehicle, transmission: null })).toBe(true);
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
