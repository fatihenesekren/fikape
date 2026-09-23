import { describe, expect, it } from "vitest";
import {
  modelYillari, ortakBeygir, paketSecenekleri, paketeGore, trimAdi, versiyonSecenekleri, versiyonaGore,
  vitesDurumu, yakitDurumu, yilNesilleri, yilTipleri,
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

  it("trim adı ve beygir", () => {
    const t = paketeGore(versiyonaGore(yilTipleri(egea, 2019), "1.4 Fire · 95 HP"), "Urban");
    expect(ortakBeygir(t)).toBe(95);
    expect(trimAdi("1.4 Fire", "Urban")).toBe("1.4 Fire – Urban");
    expect(trimAdi("1.4 Fire", "Paket adı belirtilmemiş")).toBe("1.4 Fire");
  });
});
