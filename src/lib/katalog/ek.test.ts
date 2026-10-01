import { describe, expect, it } from "vitest";
import { fotoUrlGecerli, temizMetin, yilCoz } from "./metin";
import {
  adAnahtar, sozcukAnahtar, ekYilGecerli, katalogBirlestir, legacyBirlestir, markalariBirlestir, trimParcala, urunlerdenEk,
  type LegacyMake,
} from "./ek";
import { benzerAdlar, benzerUyarilar, levenshtein } from "./benzerlik";
import { modelYillari, yilTipleri } from "./secim";
import type { KatalogMarkaDosyasi } from "./tipler";

const statik = (): KatalogMarkaDosyasi => ({
  marka: "Kia", kategori: "otomobil", kaynak: "x",
  modeller: [
    { ad: "Ceed", nesiller: [], tipler: [{ v: "1.6 CRDi", hp: 115, p: "Concept", k: null, y: [2018], f: "DIESEL", t: "Manuel" }] },
    { ad: "Pride", nesiller: [{ ad: "Pride", bas: 1990, bit: 2000, el: { versiyonlar: ["1.3", "Diğer"], paketler: ["Standart", "Diğer"] } }], tipler: [] },
  ],
});

describe("yardımcılar", () => {
  it("yıl doğrulama", () => {
    expect(ekYilGecerli(2018)).toBe(true);
    expect(ekYilGecerli(1899)).toBe(false);
    expect(ekYilGecerli(2018.5)).toBe(false);
    expect(ekYilGecerli(new Date().getFullYear() + 2)).toBe(false);
  });
  it("sözcük sırası farkı aynı sayılır", () => {
    expect(sozcukAnahtar("sDrive16d 1.5")).toBe(sozcukAnahtar("1.5 SDRIVE16D"));
  });
  it("aksan/noktalama duyarsız anahtar", () => {
    expect(adAnahtar("C-Elysée")).toBe(adAnahtar("c elysee"));
    expect(adAnahtar("İstanbul")).toBe("ISTANBUL");
  });
  it("trimName versiyon + paket olarak ayrılır", () => {
    expect(trimParcala("1.6 T-GDI 2WD – GT Line Premium")).toEqual({ v: "1.6 T-GDI 2WD", p: "GT Line Premium" });
    expect(trimParcala("1.5 TSI")).toEqual({ v: "1.5 TSI", p: null });
    expect(trimParcala("Prestige")).toEqual({ v: "", p: "Prestige" });
    expect(trimParcala(null)).toEqual({ v: "", p: null });
  });
});

describe("urunlerdenEk / katalogBirlestir", () => {
  it("aynı kombinasyon yılları birleştirir, geçersiz yakıt/vites null olur", () => {
    const ek = urunlerdenEk("Kia", [
      { modelAd: "Stonic", year: 2020, trimName: "1.0 T-GDI – Elegance", fuelType: "GASOLINE", transmission: "Otomatik", powerHp: 120 },
      { modelAd: "Stonic", year: 2021, trimName: "1.0 T-GDI – Elegance", fuelType: "GASOLINE", transmission: "Otomatik", powerHp: 120 },
      { modelAd: "Stonic", year: 2021, trimName: "1.0 T-GDI – Style", fuelType: "ROKET", transmission: "Foo", powerHp: null },
    ]);
    const tipler = ek.modeller[0].tipler;
    expect(tipler).toHaveLength(2);
    expect(tipler[0].y).toEqual([2020, 2021]);
    expect(tipler[1].f).toBeNull();
    expect(tipler[1].t).toBeNull();
    expect(tipler.every((t) => t.e)).toBe(true);
  });

  it("statikte olmayan model eklenir, olan model aynı kombinasyonu tekrar etmez", () => {
    const ek = urunlerdenEk("Kia", [
      { modelAd: "Stonic", year: 2020, trimName: "1.0 T-GDI – Elegance", fuelType: "GASOLINE", transmission: "Otomatik", powerHp: null },
      { modelAd: "Ceed", year: 2018, trimName: "1.6 CRDi – Concept", fuelType: "DIESEL", transmission: "Manuel", powerHp: 115 },
      { modelAd: "ceed", year: 2019, trimName: "1.6 CRDi – Concept", fuelType: "DIESEL", transmission: "Manuel", powerHp: 115 },
    ]);
    const s = statik();
    const b = katalogBirlestir(s, ek, "otomobil");
    expect(b.modeller.map((m) => m.ad)).toEqual(["Ceed", "Pride", "Stonic"]);
    const ceed = b.modeller.find((m) => m.ad === "Ceed")!;
    // 2018 zaten statikte var → tekrar yok; 2019 yeni yıl olarak eklenir
    expect(ceed.tipler).toHaveLength(2);
    expect(ceed.tipler[1]).toMatchObject({ e: true, y: [2019] });
    // girdiler değişmez
    expect(s.modeller).toHaveLength(2);
    expect(s.modeller[0].tipler).toHaveLength(1);
  });

  it("statikte hiç olmayan marka (dosya yok) sıfırdan kurulur", () => {
    const ek = urunlerdenEk("Yeni Marka", [{ modelAd: "X1", year: 2024, trimName: "Plus", fuelType: "EV", transmission: "Otomatik", powerHp: null }]);
    const b = katalogBirlestir(null, ek, "otomobil");
    expect(b.marka).toBe("Yeni Marka");
    expect(modelYillari(b.modeller[0])).toEqual([2024]);
    expect(yilTipleri(b.modeller[0], 2024)).toHaveLength(1);
  });

  it("eski nesil (el) modelinde eklenen versiyon/paket el seçeneklerine de yazılır", () => {
    const ek = urunlerdenEk("Kia", [{ modelAd: "Pride", year: 1995, trimName: "1.5 – GLXi", fuelType: "GASOLINE", transmission: "Manuel", powerHp: null }]);
    const b = katalogBirlestir(statik(), ek, "otomobil");
    const el = b.modeller.find((m) => m.ad === "Pride")!.nesiller[0].el!;
    expect(el.versiyonlar).toEqual(["1.3", "1.5", "Diğer"]);
    expect(el.paketler).toEqual(["Standart", "GLXi", "Diğer"]);
  });

  it("kullanıcı eklemesi resmi/eski nesil verisini bastırmaz (e tipleri tavanı etkilemez)", () => {
    const ek = urunlerdenEk("Kia", [{ modelAd: "Pride", year: 2024, trimName: "Yeni", fuelType: null, transmission: null, powerHp: null }]);
    const b = katalogBirlestir(statik(), ek, "otomobil");
    const pride = b.modeller.find((m) => m.ad === "Pride")!;
    // el nesil yılları (1990-2000) kaybolmadı, eklenen 2024 de seçilebilir
    const yillar = modelYillari(pride);
    expect(yillar).toContain(2000);
    expect(yillar).toContain(2024);
  });

  it("marka listesi: statikte olmayan markalar eklenir (aksan/harf duyarsız)", () => {
    expect(markalariBirlestir(["Citroen", "Kia"], ["Citroën", "Yeni Marka", "yeni marka"])).toEqual(["Yeni Marka"]);
  });
});

describe("legacyBirlestir (karavan / e-scooter / e-bisiklet)", () => {
  const temel = (): LegacyMake[] => [
    { make: "Segway", models: [{ name: "Max G2", versions: ["Standart", "Diğer"], trims: ["Diğer"] }, { name: "Diğer", versions: ["Diğer"], trims: ["Diğer"] }] },
    { make: "Diğer / Bulamadım", models: [] },
  ];
  it("yeni model/marka 'Diğer' seçeneklerinden önce eklenir", () => {
    const ek = [
      { marka: "Segway", modeller: [{ ad: "P100S", tipler: [{ v: "Pro", hp: null, p: "Plus", k: null, y: [2024], f: null, t: null, e: true }] }] },
      { marka: "Xiaomi", modeller: [{ ad: "Pro 4", tipler: [] }] },
    ];
    const b = legacyBirlestir(temel(), ek);
    expect(b[0].models.map((m) => m.name)).toEqual(["Max G2", "P100S", "Diğer"]);
    expect(b[0].models[1].versions).toEqual(["Pro", "Diğer"]);
    expect(b[0].models[1].trims).toEqual(["Plus", "Diğer"]);
    expect(b.map((m) => m.make)).toEqual(["Segway", "Xiaomi", "Diğer / Bulamadım"]);
  });
});

describe("benzerlik (admin uyarıları)", () => {
  it("levenshtein", () => {
    expect(levenshtein("kitten", "sitting")).toBe(3);
    expect(levenshtein("a", "a")).toBe(0);
  });
  it("aksan farkı 'ayni', 1-2 harf farkı 'yakin', kısa adlarda alarm yok", () => {
    expect(benzerAdlar("Citroen", ["Citroën"]).ayni).toEqual(["Citroën"]);
    expect(benzerAdlar("Volswagen", ["Volkswagen", "Audi"]).yakin).toEqual(["Volkswagen"]);
    expect(benzerAdlar("Kia", ["Kie"]).yakin).toEqual([]);
    expect(benzerAdlar("Kia", ["Kia"]).ayni).toEqual([]);
  });
  it("uyarı cümleleri", () => {
    const u = benzerUyarilar({
      brand: "Citroen", model: "C-Elysee (2012-2022)", trim: "1.6 HDi - Shine",
      markalar: ["Citroën"], modeller: ["C-Elysée"], trimler: ["1.6 HDi – Shine"],
    });
    expect(u.length).toBeGreaterThanOrEqual(2);
    expect(u.join(" ")).toContain("Citroën");
  });
});

describe("metin yardımcıları", () => {
  it("temizMetin gizli karakter ve boşlukları temizler", () => {
    expect(temizMetin("  Kia\u200B   Stonic\u0000 ")).toBe("Kia Stonic");
    expect(temizMetin(5)).toBeNull();
  });
  it("yilCoz yalnız 4 haneli sayıyı kabul eder", () => {
    expect(yilCoz("2020")).toBe(2020);
    expect(yilCoz(2020)).toBe(2020);
    expect(yilCoz("")).toBeNull();
    expect(yilCoz("0x7E4")).toBe("gecersiz");
    expect(yilCoz([2020])).toBe("gecersiz");
    expect(yilCoz(2020.5)).toBe("gecersiz");
  });
  it("fotoUrlGecerli yalnız https Blob adresi", () => {
    expect(fotoUrlGecerli("https://abc.public.blob.vercel-storage.com/x.jpg")).toBe(true);
    expect(fotoUrlGecerli("http://abc.public.blob.vercel-storage.com/x.jpg")).toBe(false);
    expect(fotoUrlGecerli("https://evil.com/x.jpg")).toBe(false);
    expect(fotoUrlGecerli("javascript:alert(1)")).toBe(false);
  });
});

describe("veri bütünlüğü düzeltmeleri", () => {
  it("'Standart' paket null sayılır, ASCII tire de ayırıcıdır", () => {
    expect(trimParcala("1.5 TSI – Standart")).toEqual({ v: "1.5 TSI", p: null });
    expect(trimParcala("1.4 TSI - Trendline")).toEqual({ v: "1.4 TSI", p: "Trendline" });
    expect(trimParcala("Standart")).toEqual({ v: "", p: null });
  });
  it("statikte aynı araç (versiyon/vites boş) kopya 'Standart · HP' tipi üretmez", () => {
    const s = statik();
    s.modeller[0].tipler = [{ v: "1.4 Fire", hp: 95, p: "Urban", k: null, y: [2020], f: "GASOLINE", t: null }];
    const ek = urunlerdenEk("Kia", [{ modelAd: "Ceed", year: 2022, trimName: "Urban", fuelType: "GASOLINE", transmission: "Manuel", powerHp: 95 }]);
    const b = katalogBirlestir(s, ek, "otomobil");
    const tipler = b.modeller.find((m) => m.ad === "Ceed")!.tipler;
    expect(tipler).toHaveLength(2);
    expect(tipler[1]).toMatchObject({ v: "1.4 Fire", y: [2022], e: true });
  });
  it("sondaki rakam farklı model (Sealion 6) nesilsiz modele yanlış yazılmaz", () => {
    const s: KatalogMarkaDosyasi = { marka: "BYD", kategori: "otomobil", kaynak: "x", modeller: [{ ad: "Sealion 7", nesiller: [], tipler: [] }] };
    const ek = urunlerdenEk("BYD", [{ modelAd: "Sealion 6", year: 2025, trimName: null, fuelType: null, transmission: null, powerHp: null }]);
    expect(katalogBirlestir(s, ek, "otomobil").modeller.map((m) => m.ad)).toEqual(["Sealion 6", "Sealion 7"]);
  });
  it("legacy: parantezli statik model adıyla eşleşir (kopya model yok)", () => {
    const make: LegacyMake[] = [{ make: "Specialized", models: [{ name: "Turbo Vado (Trekking, 2019-)", versions: ["Diğer"], trims: ["Diğer"] }, { name: "Diğer", versions: ["Diğer"], trims: ["Diğer"] }] }];
    const b = legacyBirlestir(make, [{ marka: "Specialized", modeller: [{ ad: "Turbo Vado", tipler: [] }] }]);
    expect(b[0].models.map((m) => m.name)).toEqual(["Turbo Vado (Trekking, 2019-)", "Diğer"]);
  });
  it("benzerlik: tam ad listede varsa uyarı yok, rakam farkı yazım hatası sayılmaz", () => {
    expect(benzerAdlar("Ioniq 5", ["Ioniq 5", "Ioniq 6", "Ioniq 9"])).toEqual({ ayni: [], yakin: [] });
    expect(benzerAdlar("Ioniq 5", ["Ioniq 6"]).yakin).toEqual([]);
    expect(benzerUyarilar({ brand: "Honda", model: "Civic", trim: null, markalar: ["Coda"], modeller: [], trimler: [] })).toEqual([]);
  });
});
