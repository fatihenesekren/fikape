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

  it("iki tarafın da donanımı boşsa (donanımsız araç) yıl/yakıt/vites aynıysa kopya sayar", () => {
    const donanimsiz = { year: 2020, trimName: null, transmission: "Manuel", fuelType: "GASOLINE" };
    expect(birebirAyniArac(donanimsiz, { ...donanimsiz, trimName: "" })).toBe(true);
    expect(birebirAyniArac(donanimsiz, { ...donanimsiz, trimName: "Comfort" })).toBe(false);
  });

  it("e-bisiklet / e-scooter / karavan: yakıt-vites kimlikte yok → yıl + donanım (boş = boş) aynıysa kopya (RKS BN5 Pro örneği)", () => {
    const rks = { year: 2026, trimName: null, transmission: null, fuelType: null };
    for (const k of ["e-bisiklet", "e-scooter", "karavan"]) {
      expect(birebirAyniArac(rks, { ...rks, trimName: "" }, k)).toBe(true);
      expect(birebirAyniArac(rks, { ...rks, year: 2025 }, k)).toBe(false);
      expect(birebirAyniArac(rks, { ...rks, trimName: "Pro" }, k)).toBe(false);
      expect(birebirAyniArac(rks, { ...rks, year: null }, k)).toBe(false);
    }
    // kategori verilmezse (eski çağrılar) ya da motorlu kategoride yakıt/vites yine şart
    expect(birebirAyniArac(rks, rks)).toBe(false);
    expect(birebirAyniArac(rks, rks, "otomobil")).toBe(false);
  });
});
