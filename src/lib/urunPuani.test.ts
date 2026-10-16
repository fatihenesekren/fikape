import { describe, expect, it } from "vitest";
import { puanHesapla, SANAL_YORUM } from "./urunPuani";

const oncel = { scoreFiyat: 3.5, scoreKalite: 3.5, scorePerformans: 3.5, scoreOverall: 3.5 };
const toplam = (puan: number, adet: number, agirlik = 1) => ({
  sw: adet * agirlik, swFiyat: adet * agirlik * puan, swKalite: adet * agirlik * puan, swPerformans: adet * agirlik * puan, swOverall: adet * agirlik * puan,
});

describe("puanHesapla", () => {
  it("az yorumda genel ortalamaya çekilir: 2 yorumlu araca 5 sahte 5★ eklemek puanı uçurmaz", () => {
    const iki = puanHesapla(toplam(3, 2), oncel).scoreOverall;
    const yedi = puanHesapla({ ...toplam(3, 2), sw: 7, swOverall: 2 * 3 + 5 * 5 }, oncel).scoreOverall;
    expect(iki).toBeCloseTo((6 + SANAL_YORUM * 3.5) / (2 + SANAL_YORUM), 5);
    // düz ortalama 4,43'e fırlardı; sönümlü hâli çok daha düşük kalır
    expect(yedi).toBeLessThan(4.2);
    expect(yedi).toBeGreaterThan(iki);
  });

  it("çok yorumda gerçek ortalamaya yaklaşır", () => {
    expect(puanHesapla(toplam(4.5, 500), oncel).scoreOverall).toBeCloseTo(4.5, 1);
  });

  it("düşük güvenli yorum daha az ağırlık taşır", () => {
    const guvenilir = puanHesapla({ sw: 1.2 + 0.7, swFiyat: 0, swKalite: 0, swPerformans: 0, swOverall: 1.2 * 5 + 0.7 * 1 }, oncel).scoreOverall;
    const esit = puanHesapla({ sw: 2, swFiyat: 0, swKalite: 0, swPerformans: 0, swOverall: 5 + 1 }, oncel).scoreOverall;
    expect(guvenilir).toBeGreaterThan(esit);
  });

  it("yorum yoksa genel ortalamayı verir", () => {
    expect(puanHesapla({ sw: 0, swFiyat: 0, swKalite: 0, swPerformans: 0, swOverall: 0 }, oncel).scoreOverall).toBeCloseTo(3.5, 5);
  });
});
