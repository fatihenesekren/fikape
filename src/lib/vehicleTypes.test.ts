import { describe, it, expect } from "vitest";
import {
  MOTO_TYPES, toLabelMap, toValues, normalizeAttributeValues,
} from "./vehicleTypes";

describe("vehicleTypes", () => {
  it("MOTO_TYPES scooter içerir", () => {
    expect(toValues(MOTO_TYPES)).toContain("scooter");
  });

  it("toLabelMap value→label eşler", () => {
    expect(toLabelMap(MOTO_TYPES).scooter).toBe("Scooter");
    expect(toLabelMap(MOTO_TYPES).retro).toBe("Retro/Klasik");
  });

  it("normalizeAttributeValues sayı ve boolean stringleri çevirir", () => {
    expect(normalizeAttributeValues({
      engine_cc: "125", power_hp: "12.5", abs: "true", four_wd: "false",
      torque_nm: "-5",
    })).toEqual({ engine_cc: 125, power_hp: 12.5, abs: true, four_wd: false, torque_nm: -5 });
  });

  it("normalizeAttributeValues enum/metin değerlere dokunmaz", () => {
    expect(normalizeAttributeValues({
      fuel_type: "GASOLINE", ip_rating: "IP54", pedelec_class: "standard-25",
      segment: "A", moto_type: "scooter", zero_to_100: "8.5sn",
    })).toEqual({
      fuel_type: "GASOLINE", ip_rating: "IP54", pedelec_class: "standard-25",
      segment: "A", moto_type: "scooter", zero_to_100: "8.5sn",
    });
  });

  it("normalizeAttributeValues string olmayanları aynen geçirir", () => {
    expect(normalizeAttributeValues({ n: 42, b: true, arr: [1], nil: null }))
      .toEqual({ n: 42, b: true, arr: [1], nil: null });
  });
});
