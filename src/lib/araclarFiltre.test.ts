import { describe, expect, it } from "vitest";
import { listeParametresi, sonucVermeyenSecimleriAyikla } from "./araclarFiltre";
import { facetGroupsForCategory } from "./vehicleFacets";

describe("listeParametresi", () => {
  it("boş / tanımsız", () => {
    expect(listeParametresi(undefined)).toEqual([]);
    expect(listeParametresi("")).toEqual([]);
    expect(listeParametresi(null)).toEqual([]);
  });
  it("kırpar, boşları ve tekrarları atar, sırayı korur", () => {
    expect(listeParametresi("rks, volta ,,rks,cowboy")).toEqual(["rks", "volta", "cowboy"]);
    expect(listeParametresi("bmw")).toEqual(["bmw"]);
  });
});

describe("sonucVermeyenSecimleriAyikla (e-bisiklet)", () => {
  const gruplar = facetGroupsForCategory("e-bisiklet"); // tip, motor, guc, batarya, menzil
  const urunler = [
    { brand: { slug: "rks" }, attributes: { bike_type: "katlanabilir", motor_type: "hub-drive", battery_wh: 360 } },
    { brand: { slug: "rks" }, attributes: { bike_type: "katlanabilir", motor_type: "hub-drive", battery_wh: 280 } },
    { brand: { slug: "volta" }, attributes: { bike_type: "sehir", motor_type: "hub-drive", battery_wh: 360 } },
    { brand: { slug: "trek" }, attributes: { bike_type: "sehir", motor_type: "mid-drive", battery_wh: 625 } },
  ];

  it("marka sonrası sonuç vermeyen değer düşer, sonuç veren kalır (ekran görüntüsündeki durum)", () => {
    const r = sonucVermeyenSecimleriAyikla(urunler, gruplar, ["rks"], { tip: ["katlanabilir", "sehir"] });
    expect(r).toEqual({ tip: ["katlanabilir"] });
  });
  it("marka yokken tüm veride sonuç veren değer korunur", () => {
    const r = sonucVermeyenSecimleriAyikla(urunler, gruplar, [], { tip: ["katlanabilir", "sehir"] });
    expect(r).toEqual({ tip: ["katlanabilir", "sehir"] });
  });
  it("çoklu marka: kapsam markaların birleşimidir", () => {
    const r = sonucVermeyenSecimleriAyikla(urunler, gruplar, ["rks", "volta"], { tip: ["katlanabilir", "sehir"], motor: ["mid"] });
    expect(r).toEqual({ tip: ["katlanabilir", "sehir"] }); // mid-drive yalnız trek'te
  });
  it("üstteki grup kazanır: alttaki çakışan seçim düşer", () => {
    // tip=sehir seçili; motor=hub (volta var) korunur; batarya 0-400 (volta 360) korunur; menzil bilinmeyen değer düşer
    const r = sonucVermeyenSecimleriAyikla(urunler, gruplar, [], { tip: ["sehir"], motor: ["hub"], batarya: ["601"], menzil: ["yok-deger"] });
    expect(r).toEqual({ tip: ["sehir"], motor: ["hub"] });
  });
  it("bütün seçimler düşerse boş nesne (ölü sayfa yerine tam liste)", () => {
    const r = sonucVermeyenSecimleriAyikla(urunler, gruplar, ["volta"], { tip: ["katlanabilir"] });
    expect(r).toEqual({});
  });
  it("görünür grupta olmayan anahtar düşer", () => {
    const r = sonucVermeyenSecimleriAyikla(urunler, gruplar, [], { yakit: ["benzin"] });
    expect(r).toEqual({});
  });
  it("Belirtilmemiş (na) boş alanlı ürün varsa korunur", () => {
    const veri = [...urunler, { brand: { slug: "rks" }, attributes: {} }];
    expect(sonucVermeyenSecimleriAyikla(veri, gruplar, ["rks"], { batarya: ["na"] })).toEqual({ batarya: ["na"] });
    expect(sonucVermeyenSecimleriAyikla(urunler, gruplar, ["rks"], { batarya: ["na"] })).toEqual({});
  });
});
