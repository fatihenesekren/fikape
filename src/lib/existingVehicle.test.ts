import { describe, expect, it } from "vitest";
import { birebirAyniArac } from "./existingVehicle";

const mevcut = { year: 2021, trimName: "sDrive16d 1.5 – X Line", transmission: "Otomatik", fuelType: "DIESEL" };

describe("birebirAyniArac", () => {
  it("yıl/donanım/yakıt/vitesin TAMAMI aynıysa gerçek kopya sayar", () => {
    const yeni = { year: 2021, trimName: "sDrive16d 1.5 – X Line", transmission: "Otomatik", fuelType: "DIESEL" };
    expect(birebirAyniArac(mevcut, yeni)).toBe(true);
  });

  it("donanım/trim büyük-küçük harf ve boşluk farkına duyarlı değildir", () => {
    const yeni = { year: 2021, trimName: "  SDRIVE16D 1.5 – X LINE  ", transmission: "otomatik", fuelType: "DIESEL" };
    expect(birebirAyniArac(mevcut, yeni)).toBe(true);
  });

  it("yıl farklıysa (gerçekten farklı varyant) kopya saymaz", () => {
    const yeni = { year: 2022, trimName: "sDrive16d 1.5 – X Line", transmission: "Otomatik", fuelType: "DIESEL" };
    expect(birebirAyniArac(mevcut, yeni)).toBe(false);
  });

  it("donanım paketi farklıysa (BMW X1 2021 X Line vs 2022 M Sport gibi) kopya saymaz", () => {
    const yeni = { year: 2021, trimName: "sDrive18i – M Sport", transmission: "Otomatik", fuelType: "GASOLINE" };
    expect(birebirAyniArac(mevcut, yeni)).toBe(false);
  });

  it("vites farklıysa kopya saymaz", () => {
    const yeni = { ...mevcut, transmission: "Manuel" };
    expect(birebirAyniArac(mevcut, yeni)).toBe(false);
  });

  it("herhangi bir alan bilinmiyorsa (null) 'aynı olduğundan emin değiliz' sayıp kopya saymaz", () => {
    expect(birebirAyniArac(mevcut, { ...mevcut, year: null })).toBe(false);
    expect(birebirAyniArac(mevcut, { ...mevcut, trimName: null })).toBe(false);
    expect(birebirAyniArac(mevcut, { ...mevcut, transmission: null })).toBe(false);
    expect(birebirAyniArac(mevcut, { ...mevcut, fuelType: null })).toBe(false);
    expect(birebirAyniArac({ ...mevcut, trimName: null }, mevcut)).toBe(false);
  });
});
