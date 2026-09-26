import { describe, expect, it } from "vitest";
import { motorMetinleriniTutarliYap } from "./motorTutarlilik";

describe("motorMetinleriniTutarliYap", () => {
  it("aynı kelimelerin farklı sırayla yazıldığı motorları en sık geçen yazıma sabitler (Corolla Hybrid gibi)", () => {
    const tipler = [
      { motor: "1.8 Hybrid" }, { motor: "1.8 Hybrid" }, { motor: "1.8 Hybrid" },
      { motor: "Hybrid 1.8" }, { motor: "Hybrid 1.8" },
    ];
    motorMetinleriniTutarliYap(tipler);
    expect(new Set(tipler.map((t) => t.motor))).toEqual(new Set(["1.8 Hybrid"]));
  });

  it("üç yazımı olan bir motoru (Amarok gibi) tek yazıma indirir", () => {
    const tipler = [
      { motor: "V6 3.0 TDI" }, { motor: "3.0 V6 TDI" }, { motor: "3.0 V6 TDI" }, { motor: "3.0 TDI V6" },
    ];
    motorMetinleriniTutarliYap(tipler);
    const sonuclar = new Set(tipler.map((t) => t.motor));
    expect(sonuclar.size).toBe(1);
  });

  it("farklı kelime kümesi olan (gerçekten farklı) motorlara dokunmaz", () => {
    const tipler = [{ motor: "1.6 TDI" }, { motor: "2.0 TDI" }, { motor: null }];
    motorMetinleriniTutarliYap(tipler);
    expect(tipler.map((t) => t.motor)).toEqual(["1.6 TDI", "2.0 TDI", null]);
  });

  it("eşitlikte alfabetik olarak deterministik seçer", () => {
    const tipler = [{ motor: "B4 2.0" }, { motor: "2.0 B4" }];
    motorMetinleriniTutarliYap(tipler);
    // her iki yazım da 1'er kez geçiyor — alfabetik olarak "2.0 B4" kazanır
    expect(new Set(tipler.map((t) => t.motor))).toEqual(new Set(["2.0 B4"]));
  });
});
