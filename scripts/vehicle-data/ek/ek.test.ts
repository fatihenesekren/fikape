import { describe, expect, it } from "vitest";
import type { KatalogModel } from "../../../src/lib/katalog/tipler";
import { parseEk } from "./parseEk";
import { ekUygula, modelleriTekillestir, yakitKurali } from "./uygula";

const metin = (satirlar: string[]) => satirlar.join("\n");

describe("parseEk", () => {
  it("boş satırla ayrılan alt blokları ve seviyeleri doğru okur", () => {
    const ek = parseEk(metin([
      "Otomobil", "Alfa Romeo", "147 (93)", "", "---------------------", "",
      "Otomobil", "Alfa Romeo", "147", "1.6 TS (85)", "2.0 TS (7)", "",
      "Otomobil", "Alfa Romeo", "147", "1.6 TS", "Black Line (4)", "Distinctive (68)", "",
    ]));
    expect(ek.marka).toBe("Alfa Romeo");
    const m = ek.modeller.get("147")!;
    expect([...m.versiyonlar.keys()]).toEqual(["1.6 TS", "2.0 TS"]);
    expect([...m.versiyonlar.get("1.6 TS")!]).toEqual(["Black Line", "Distinctive"]);
  });
});

const elModel = (): KatalogModel => ({
  ad: "147 (2000-2010)",
  tipler: [],
  nesiller: [{
    ad: "147 (2000-2010)", bas: 2000, bit: 2010,
    el: {
      versiyonlar: ["1.6 Twin Spark 105", "1.6 Twin Spark 120", "1.9 JTD 115", "Diğer"],
      paketler: ["Progression", "Distinctive", "Diğer"],
    },
  }],
});

describe("ekUygula — kopya üretmez", () => {
  const dosya = (...s: string[]) => parseEk(metin(["Otomobil", "Alfa Romeo", ...s, ""]));

  it("hp'siz aynı motor + var olan paket → eklenmez; yeni paket mevcut versiyonlara eklenir", () => {
    const modeller = [elModel()];
    const s = ekUygula("Alfa Romeo", dosya("147", "1.6 TS", "Distinctive (68)", "Black Line (4)"), {}, modeller);
    expect(s.zatenVar).toBe(1);
    expect(s.eklenen).toHaveLength(1);
    const el = modeller[0].nesiller[0].el!;
    expect(el.versiyonlar.filter((v) => v.startsWith("1.6"))).toHaveLength(2); // yeni versiyon açılmadı
    expect(el.paketlerVersiyona!["1.6 Twin Spark 105"]).toContain("Black Line");
  });

  it("paket motor koduyla versiyonun içinde kalıyorsa (2.0 + TS ↔ 2.0 TS) eklenmez", () => {
    const m = elModel();
    m.nesiller[0].el!.versiyonlar.unshift("2.0 Twin Spark 150");
    const s = ekUygula("Alfa Romeo", dosya("147", "2.0", "TS (3)"), {}, [m]);
    expect(s.eklenen).toHaveLength(0);
    expect(s.zatenVar).toBe(1);
  });

  it("yazım farkı şüphesi ve JTD/JTDm yakın yazımı belirsize düşer, eklenmez", () => {
    const m = elModel();
    m.nesiller[0].el!.versiyonlar.unshift("1.9 JTDm 140");
    const s = ekUygula("Alfa Romeo", dosya("147", "1.9 JTD", "Distinctive (1)", "1.9 JTD (2)"), {}, [m]);
    // "1.9 JTD" birebir var → Distinctive eklenir; JTDm ile karışmaz
    expect(s.belirsiz).toHaveLength(0);
    const s2 = ekUygula("Alfa Romeo", dosya("147", "2.0 JTD", "Distinctive (1)"), {}, [{ ...elModel(), nesiller: [{ ...elModel().nesiller[0], el: { versiyonlar: ["2.0 JTDm 140", "Diğer"], paketler: ["Diğer"] } }] }]);
    expect(s2.belirsiz[0].neden).toMatch(/aynı motor olabilir/);
  });

  it("2012 sonrasına uzanan ve resmi tipi olan modelde yılsız satır eklenmez", () => {
    const m: KatalogModel = {
      ad: "Giulietta", nesiller: [{ ad: "Giulietta (2010-2020)", bas: 2010, bit: 2020, el: { versiyonlar: [], paketler: ["Diğer"] } }],
      tipler: [{ v: "1.4 TB", hp: 120, p: "Distinctive", k: null, y: [2012], f: "GASOLINE", t: null }],
    };
    const s = ekUygula("Alfa Romeo", dosya("Giulietta", "1.6 JTD", "Super TCT (34)"), {}, [m]);
    expect(s.eklenen).toHaveLength(0);
    expect(s.belirsiz).toHaveLength(1);
  });

  it("kasa tipi satırı versiyon olarak eklenmez", () => {
    const m: KatalogModel = { ad: "500e", nesiller: [], tipler: [] };
    const s = ekUygula("Abarth", dosya("500e", "Cabrio (3)", "Coupe (1)"), {}, [m]);
    expect(s.belirsiz.map((b) => b.versiyon)).toEqual(["Cabrio", "Coupe"]);
  });

  it("paketi olmayan satır Standart olur ve ikinci kez çalıştırılınca değişmez", () => {
    const modeller: KatalogModel[] = [];
    const ayar = { yeniModel: { S: { bas: 2021, bit: null, kaynak: "test" } } };
    const ek = dosya("S", "580 (2)");
    ekUygula("Aion", ek, ayar, modeller);
    const ilk = JSON.stringify(modeller);
    const s2 = ekUygula("Aion", ek, ayar, modeller);
    expect(s2.eklenen).toHaveLength(0);
    expect(JSON.stringify(modeller)).toBe(ilk);
    expect(modeller[0].nesiller[0].el!.paketlerVersiyona!["580"]).toEqual(["Standart", "Diğer"]);
  });
});

describe("modelleriTekillestir / yakitKurali", () => {
  it("A 110 ile A110 tek modelde birleşir", () => {
    const modeller: KatalogModel[] = [
      { ad: "A 110", nesiller: [], tipler: [{ v: "", hp: null, p: "S", k: null, y: [2020], f: null, t: null }] },
      { ad: "A110", nesiller: [{ ad: "A110 (2017-)", bas: 2017, bit: null }], tipler: [{ v: "", hp: null, p: "S", k: null, y: [2019], f: null, t: null }] },
    ];
    modelleriTekillestir(modeller);
    expect(modeller).toHaveLength(1);
    expect(modeller[0].tipler).toHaveLength(1);
    expect(modeller[0].tipler[0].y).toEqual([2019, 2020]);
  });
  it("yakıtı yalnız motor kodu tek anlamlı söylüyorsa çıkarır", () => {
    expect(yakitKurali("1.9 JTD")).toBe("DIESEL");
    expect(yakitKurali("2.0 TS")).toBe("GASOLINE");
    expect(yakitKurali("1.5")).toBeNull();
  });
});
