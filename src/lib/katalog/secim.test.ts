import { describe, expect, it } from "vitest";
import {
  kasaSecenekleri, kasayaGore, modelYillari, ortakBeygir, paketSecenekleri, paketeGore, trimAdi, versiyonSecenekleri,
  versiyonaGore, versiyonBilgisiVarMi, vitesDurumu, yakitDurumu, yilNesilleri, yilTipleri,
} from "./secim";
import type { KatalogModel, KatalogTip } from "./tipler";

const tip = (o: Partial<KatalogTip>): KatalogTip => ({ v: "1.4 Fire", hp: 95, p: "Urban", k: "Sedan", y: [2019], f: "GASOLINE", t: null, ...o });

const egea: KatalogModel = {
  ad: "Egea",
  nesiller: [],
  tipler: [
    tip({}),
    tip({ v: "1.6 E-Torq", hp: 110, t: "Otomatik", y: [2018, 2019] }),
    tip({ v: "1.6 E-Torq", hp: 110, p: "Lounge", t: "Otomatik", y: [2018] }),
    tip({ v: "1.3 Multijet", hp: 95, f: "DIESEL", y: [2019] }),
  ],
};

describe("katalog seçimi", () => {
  it("yalnız o yıl satılan versiyon ve paketleri sunar — imkânsız kombinasyon yok", () => {
    const y2019 = yilTipleri(egea, 2019);
    expect(versiyonSecenekleri(y2019)).toEqual(["1.3 Multijet · 95 HP", "1.4 Fire · 95 HP", "1.6 E-Torq · 110 HP"]);
    // 2019'da Lounge yok (yalnız 2018)
    expect(paketSecenekleri(versiyonaGore(y2019, "1.6 E-Torq · 110 HP"))).toEqual(["Urban"]);
    expect(paketSecenekleri(yilTipleri(egea, 2018))).toEqual(["Lounge", "Urban"]);
  });

  it("yakıt/vitesi yalnız kaynak kesinse kilitler, bilinmiyorsa kullanıcıya bırakır", () => {
    const eTorq = versiyonaGore(yilTipleri(egea, 2019), "1.6 E-Torq · 110 HP");
    expect(yakitDurumu(eTorq)).toEqual({ kilitli: "GASOLINE" });
    expect(vitesDurumu(eTorq)).toEqual({ kilitli: "Otomatik" });
    const fire = versiyonaGore(yilTipleri(egea, 2019), "1.4 Fire · 95 HP");
    expect(vitesDurumu(fire)).toEqual({ serbest: true });
    expect(yakitDurumu(yilTipleri(egea, 2019))).toEqual({ secenekler: ["GASOLINE", "DIESEL"] });
  });

  it("2012 öncesi yılları eski nesillerden, sonrasını TSB'den alır", () => {
    const golf: KatalogModel = {
      ad: "Golf",
      nesiller: [
        { ad: "Golf 6 (2008-2012)", bas: 2008, bit: 2012, el: { versiyonlar: ["1.4 TSI 122"], paketler: ["Trendline"] } },
        { ad: "Golf 7 (2012-2020)", bas: 2012, bit: 2020 },
      ],
      tipler: [tip({ v: "1.2 TSI", y: [2013, 2014] })],
    };
    expect(modelYillari(golf)).toEqual([2014, 2013, 2011, 2010, 2009, 2008]);
    expect(yilTipleri(golf, 2011)).toEqual([]);
    expect(yilNesilleri(golf, 2011).map((n) => n.ad)).toEqual(["Golf 6 (2008-2012)"]);
  });

  it("versiyonBilgisiVarMi — motor/beygir yoksa Versiyon adımı anlamsız sayılır", () => {
    expect(versiyonBilgisiVarMi([tip({ v: "", hp: null, p: "S" })])).toBe(false);
    expect(versiyonBilgisiVarMi([tip({ v: "", hp: 204, p: null })])).toBe(true); // yalnız kW'den gelen beygir de yeterli
    expect(versiyonBilgisiVarMi([tip({ v: "1.6 E-Torq", hp: null })])).toBe(true);
  });

  it("aynı versiyon metninde beygiri boş satır, tek bilinen beygir değerine katılır (C5 Aircross gibi)", () => {
    const c5: KatalogModel = {
      ad: "C5 Aircross",
      nesiller: [],
      tipler: [
        tip({ v: "1.5 BlueHDi", hp: 130, p: "Shine", y: [2023] }),
        tip({ v: "1.5 BlueHDi", hp: 130, p: "Shine Bold", y: [2023] }),
        tip({ v: "1.5 BlueHDi", hp: null, p: "Shine Bold", y: [2023] }),
      ],
    };
    const t = yilTipleri(c5, 2023);
    // "1.5 BlueHDi" ve "1.5 BlueHDi · 130 HP" iki ayrı seçenek gibi görünmemeli
    expect(versiyonSecenekleri(t)).toEqual(["1.5 BlueHDi · 130 HP"]);
    const secilen = versiyonaGore(t, "1.5 BlueHDi · 130 HP");
    expect(secilen).toHaveLength(3);
    expect(paketSecenekleri(secilen)).toEqual(["Shine", "Shine Bold"]);
    expect(ortakBeygir(paketeGore(secilen, "Shine Bold"))).toBe(130);
  });

  it("aynı versiyon metninde birden çok FARKLI beygir varsa karıştırmaz", () => {
    const belirsiz: KatalogModel = {
      ad: "X",
      nesiller: [],
      tipler: [
        tip({ v: "2.0 TFSI", hp: 190, y: [2020] }),
        tip({ v: "2.0 TFSI", hp: 245, y: [2020] }),
        tip({ v: "2.0 TFSI", hp: null, y: [2020] }),
      ],
    };
    const t = yilTipleri(belirsiz, 2020);
    expect(versiyonSecenekleri(t)).toEqual(["2.0 TFSI", "2.0 TFSI · 190 HP", "2.0 TFSI · 245 HP"]);
  });

  it("kasa filtresi kapsayıcıdır — gerçek bir kasa seçilince kasası belirtilmemiş satırlar gizlenmez (Corolla gibi)", () => {
    const corolla: KatalogModel = {
      ad: "Corolla",
      nesiller: [],
      tipler: [
        tip({ v: "1.8 Hybrid", p: "Flame", k: "Hatchback", y: [2024] }),
        tip({ v: "1.5", p: "Dream", k: null, y: [2024] }),
        tip({ v: "1.5", p: "Vision", k: null, y: [2024] }),
      ],
    };
    const t = yilTipleri(corolla, 2024);
    expect(kasaSecenekleri(t)).toEqual(["Hatchback", "Kasa tipi belirtilmemiş"]);
    // "Hatchback" seçilince, kasası hiç yazılmamış (muhtemelen sedan) satırlar gizlenmemeli
    expect(kasayaGore(t, "Hatchback")).toHaveLength(3);
    expect(paketSecenekleri(kasayaGore(t, "Hatchback"))).toEqual(["Dream", "Flame", "Vision"]);
    // "Kasa tipi belirtilmemiş" yalnız gerçekten belirsiz olanları gösterir
    expect(kasayaGore(t, "Kasa tipi belirtilmemiş")).toHaveLength(2);
  });

  it("trim adı ve beygir", () => {
    const t = paketeGore(versiyonaGore(yilTipleri(egea, 2019), "1.4 Fire · 95 HP"), "Urban");
    expect(ortakBeygir(t)).toBe(95);
    expect(trimAdi("1.4 Fire", "Urban")).toBe("1.4 Fire – Urban");
    expect(trimAdi("1.4 Fire", "Paket adı belirtilmemiş")).toBe("1.4 Fire");
  });
});
