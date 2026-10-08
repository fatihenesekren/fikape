import { describe, expect, it } from "vitest";
import { aramaAnahtari, filtrele, lisansGrubu, markayaGrupla, sayilar, type KaynakSatir } from "./gorselKaynak";

const s = (ad: string, marka: string, kategori: string, yazar: string, lisans: string): KaynakSatir => ({
  slug: ad.toLowerCase().replace(/\s+/g, "-"), ad, marka, kategori, imageUrl: "https://x/y.jpg", yazar, kaynakUrl: null, lisans, lisansUrl: null,
});
const veri = [
  s("Citroën C5 Aircross 2023", "Citroën", "otomobil", "Alexander-93", "CC BY-SA 4.0"),
  s("BMW C 400 GT 2026", "BMW", "motosiklet", "Kaule79", "CC BY-SA 4.0"),
  s("BMW X1 2024", "BMW", "otomobil", "Cowboy", "Official"),
  s("Airstream Bambi 19CB 2022", "Airstream", "karavan", "Daderot", "CC0"),
  s("Audi A3 2026", "Audi", "otomobil", "Alexander-93", "CC BY 4.0"),
];

describe("gorselKaynak", () => {
  it("arama aksan ve Türkçe harf duyarsız", () => {
    expect(aramaAnahtari("İnmotion ÇÖĞŞÜ Citroën")).toBe("inmotion cogsu citroen");
    expect(filtrele(veri, { q: "citroen", kategori: "", lisans: "" }).map((x) => x.marka)).toEqual(["Citroën"]);
    expect(filtrele(veri, { q: "ALEXANDER", kategori: "", lisans: "" })).toHaveLength(2);
    expect(filtrele(veri, { q: "bmw 400", kategori: "", lisans: "" })).toHaveLength(0); // sözcük sırası bire bir (alt dize) aranır
    expect(filtrele(veri, { q: "c 400", kategori: "", lisans: "" })).toHaveLength(1);
  });
  it("lisans yazımları ana gruplara iner", () => {
    expect(lisansGrubu("CC BY-SA 3.0 de")).toBe("CC BY-SA");
    expect(lisansGrubu("CC BY 2.0")).toBe("CC BY");
    expect(lisansGrubu("CC0")).toBe("CC0 / Kamu malı");
    expect(lisansGrubu("Official")).toBe("Üretici görseli");
    expect(lisansGrubu("Başka")).toBe("Diğer");
  });
  it("kategori + lisans + arama birlikte süzer", () => {
    expect(filtrele(veri, { q: "", kategori: "otomobil", lisans: "" })).toHaveLength(3);
    expect(filtrele(veri, { q: "", kategori: "otomobil", lisans: "Üretici görseli" }).map((x) => x.ad)).toEqual(["BMW X1 2024"]);
    expect(filtrele(veri, { q: "bmw", kategori: "motosiklet", lisans: "CC BY-SA" })).toHaveLength(1);
  });
  it("markaya gruplar, markalar Türkçe sırada", () => {
    expect(markayaGrupla(veri).map((g) => `${g.marka}:${g.satirlar.length}`)).toEqual(["Airstream:1", "Audi:1", "BMW:2", "Citroën:1"]);
    expect(markayaGrupla(veri)[2].satirlar.map((x) => x.ad)).toEqual(["BMW C 400 GT 2026", "BMW X1 2024"]);
  });
  it("çip sayıları diğer filtrelere göre hesaplanır", () => {
    const n = sayilar(veri, { q: "", kategori: "", lisans: "CC BY-SA" });
    expect(n.kategoriler).toEqual({ otomobil: 1, motosiklet: 1 });
    expect(n.lisanslar["CC BY-SA"]).toBe(2);
    expect(sayilar(veri, { q: "", kategori: "otomobil", lisans: "" }).lisanslar).toEqual({ "CC BY-SA": 1, "Üretici görseli": 1, "CC BY": 1 });
  });
});
