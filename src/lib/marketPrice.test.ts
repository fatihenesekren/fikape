import { describe, expect, it } from "vitest";
import { parsePriceRange } from "./marketPrice";

describe("parsePriceRange", () => {
  it("geçerli aralığı ayrıştırır", () => {
    expect(parsePriceRange("1470000-1800000")).toEqual({ min: 1470000, max: 1800000 });
  });

  it("boşluklu tireyi tolere eder", () => {
    expect(parsePriceRange(" 1550000 - 1850000 ")).toEqual({ min: 1550000, max: 1850000 });
  });

  it("BELİRSİZ veya alakasız metni null döner", () => {
    expect(parsePriceRange("BELİRSİZ")).toBeNull();
    expect(parsePriceRange("Bu araç hakkında yeterli veri yok.")).toBeNull();
  });

  it("min > max ise (mantıksız) null döner", () => {
    expect(parsePriceRange("1800000-1470000")).toBeNull();
  });

  it("sıfır veya negatif değeri kabul etmez", () => {
    expect(parsePriceRange("0-1000000")).toBeNull();
  });
});
