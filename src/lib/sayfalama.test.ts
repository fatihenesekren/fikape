import { describe, expect, it } from "vitest";
import { sayfaListesi } from "./sayfalama";

describe("sayfaListesi", () => {
  it("tek veya sıfır sayfa", () => {
    expect(sayfaListesi(1, 1)).toEqual([1]);
    expect(sayfaListesi(1, 0)).toEqual([]);
  });
  it("küçük toplamda hepsi gösterilir", () => {
    expect(sayfaListesi(3, 7)).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(sayfaListesi(1, 4)).toEqual([1, 2, 3, 4]);
  });
  it("başa yakın: sağda nokta", () => {
    expect(sayfaListesi(1, 12)).toEqual([1, 2, 3, 4, 5, "…", 12]);
    expect(sayfaListesi(3, 12)).toEqual([1, 2, 3, 4, 5, "…", 12]);
  });
  it("sona yakın: solda nokta", () => {
    expect(sayfaListesi(12, 12)).toEqual([1, "…", 8, 9, 10, 11, 12]);
    expect(sayfaListesi(10, 12)).toEqual([1, "…", 8, 9, 10, 11, 12]);
  });
  it("ortada: iki yanda nokta", () => {
    expect(sayfaListesi(6, 12)).toEqual([1, "…", 5, 6, 7, "…", 12]);
  });
  it("her zaman aynı uzunlukta (zıplamayı önler) ve geçerli sayfayı içerir", () => {
    for (let g = 1; g <= 20; g++) {
      const l = sayfaListesi(g, 20);
      expect(l).toHaveLength(7);
      expect(l).toContain(g);
      expect(l[0]).toBe(1);
      expect(l[l.length - 1]).toBe(20);
    }
  });
  it("geçersiz geçerli sayfa sınırlanır", () => {
    expect(sayfaListesi(99, 12)).toContain(12);
    expect(sayfaListesi(-5, 12)).toContain(1);
  });
});

describe("sayfaListesi — kompakt (yan=0)", () => {
  it("en fazla 5 öğe, geçerli sayfa ve uçlar korunur", () => {
    for (let g = 1; g <= 20; g++) {
      const l = sayfaListesi(g, 20, 0);
      expect(l.length).toBeLessThanOrEqual(5);
      expect(l).toContain(g);
      expect(l[0]).toBe(1);
      expect(l[l.length - 1]).toBe(20);
    }
    expect(sayfaListesi(1, 7, 0)).toEqual([1, 2, 3, "…", 7]);
    expect(sayfaListesi(4, 7, 0)).toEqual([1, "…", 4, "…", 7]);
    expect(sayfaListesi(7, 7, 0)).toEqual([1, "…", 5, 6, 7]);
    expect(sayfaListesi(2, 4, 0)).toEqual([1, 2, 3, 4]);
  });
});
