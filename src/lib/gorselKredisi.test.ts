import { describe, expect, it } from "vitest";
import { commonsDosyaAdi, extmetadataKredi, htmlMetin, krediDogrula } from "./gorselKredisi";

describe("commonsDosyaAdi", () => {
  it("küçük resim ve orijinal Commons adreslerini çözer", () => {
    expect(commonsDosyaAdi("https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/Fiat_Egea_2016.jpg/960px-Fiat_Egea_2016.jpg")).toBe("Fiat_Egea_2016.jpg");
    expect(commonsDosyaAdi("https://upload.wikimedia.org/wikipedia/commons/a/ab/Fiat_Egea_2016.jpg")).toBe("Fiat_Egea_2016.jpg");
  });
  it("FilePath ve File: adreslerini çözer", () => {
    expect(commonsDosyaAdi("https://commons.wikimedia.org/wiki/Special:FilePath/Togg%20T10X.jpg?width=800")).toBe("Togg T10X.jpg?width=800".split("?")[0]);
    expect(commonsDosyaAdi("https://commons.wikimedia.org/wiki/File:Togg_T10X.jpg")).toBe("Togg T10X.jpg");
  });
  it("yerel (en/tr) Wikipedia yüklemelerini ve başka sunucuları reddeder", () => {
    expect(commonsDosyaAdi("https://upload.wikimedia.org/wikipedia/en/thumb/a/ab/Logo.png/330px-Logo.png")).toBeNull();
    expect(commonsDosyaAdi("https://example.com/a.jpg")).toBeNull();
    expect(commonsDosyaAdi(null)).toBeNull();
  });
});

describe("htmlMetin", () => {
  it("etiketleri atar ve varlıkları çözer", () => {
    expect(htmlMetin('<a href="x">Ali &amp; Veli</a>  <b>Foto</b>')).toBe("Ali & Veli Foto");
  });
});

describe("extmetadataKredi", () => {
  const ok = { Artist: { value: '<a href="//x">Ali Veli</a>' }, LicenseShortName: { value: "CC BY-SA 4.0" }, LicenseUrl: { value: "https://creativecommons.org/licenses/by-sa/4.0" } };
  it("özgür dosyada yazar+lisans üretir", () => {
    const r = extmetadataKredi("A b.jpg", ok);
    expect(r).toMatchObject({ ozgur: true, yazar: "Ali Veli", lisans: "CC BY-SA 4.0", kaynakUrl: "https://commons.wikimedia.org/wiki/File:A_b.jpg" });
  });
  it("NonFree dosyayı özgür değil işaretler", () => {
    expect(extmetadataKredi("A.jpg", { ...ok, NonFree: { value: "true" } })).toEqual({ ozgur: false });
  });
  it("yazar veya lisans yoksa null (belirsiz)", () => {
    expect(extmetadataKredi("A.jpg", { LicenseShortName: { value: "CC0" } })).toBeNull();
    expect(extmetadataKredi("A.jpg", undefined)).toBeNull();
  });
});

describe("krediDogrula", () => {
  it("geçerli nesneyi temizler, http adresini atar", () => {
    expect(krediDogrula({ yazar: " Ali ", lisans: "CC0", lisansUrl: "http://x.com", kaynakUrl: "https://y.com/a" })).toEqual({ yazar: "Ali", lisans: "CC0", lisansUrl: null, kaynakUrl: "https://y.com/a" });
  });
  it("eksik/geçersiz girdide null", () => {
    expect(krediDogrula({ yazar: "", lisans: "CC0" })).toBeNull();
    expect(krediDogrula("x")).toBeNull();
    expect(krediDogrula(null)).toBeNull();
  });
});
