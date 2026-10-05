import { describe, it, expect } from "vitest";
import { kurasyonYap, vitrineUygun, veriDoluluk, kritikDoluluk, kararliHash, type VitrinAday } from "./kurasyon";

const OTO_DOLU = { engine_cc: 1500, power_hp: 120, transmission: "Otomatik", drivetrain: "FWD", body_type: "suv", fuel_type: "GASOLINE", torque_nm: 200, seat_count: 5 };

let sayac = 0;
function aday(p: Partial<VitrinAday> = {}): VitrinAday {
  const id = p.id ?? ++sayac + 1000;
  return {
    id, modelId: p.modelId ?? id, categorySlug: "otomobil", attributes: { ...OTO_DOLU }, year: 2025, yayinda: true,
    imageUrl: "https://x/y.jpg", atifVar: true, aiOzetOnayli: true, yorumSayisi: 0, yorumOrtalamasi: 0, goruntulenme: 0, ...p,
  };
}

describe("vitrineUygun", () => {
  it("uygun aday geçer", () => expect(vitrineUygun(aday())).toBe(true));
  it("görselsiz araç elenir", () => expect(vitrineUygun(aday({ imageUrl: null }))).toBe(false));
  it("boş görsel adresi elenir", () => expect(vitrineUygun(aday({ imageUrl: "" }))).toBe(false));
  it("onaylı AI özeti olmayan elenir", () => expect(vitrineUygun(aday({ aiOzetOnayli: false }))).toBe(false));
  it("yayında olmayan elenir", () => expect(vitrineUygun(aday({ yayinda: false }))).toBe(false));
  it("kritik özellikleri çoğunlukla boş olan elenir", () => {
    expect(vitrineUygun(aday({ attributes: { fuel_type: "GASOLINE", transmission: "Manuel" } }))).toBe(false);
  });
});

describe("veri doluluğu", () => {
  it("kritik doluluk oranını hesaplar", () => {
    expect(kritikDoluluk("otomobil", OTO_DOLU)).toBe(1);
    expect(kritikDoluluk("otomobil", { fuel_type: "GASOLINE", engine_cc: 1500 })).toBeCloseTo(0.2);
  });
  it("atıf ve zengin özellik doluluğu artırır", () => {
    const a = aday();
    expect(veriDoluluk({ ...a, atifVar: true })).toBeGreaterThan(veriDoluluk({ ...a, atifVar: false }));
  });
});

describe("kurasyonYap", () => {
  it("boş listede boş döner (vitrin çökmez)", () => expect(kurasyonYap([])).toEqual([]));
  it("hiç uygun aday yoksa boş döner", () => expect(kurasyonYap([aday({ imageUrl: null })])).toEqual([]));

  it("görselsiz ve AI özetsiz kartlar hiçbir koşulda çıkmaz", () => {
    const sonuc = kurasyonYap([aday({ id: 1, imageUrl: null }), aday({ id: 2, aiOzetOnayli: false }), aday({ id: 3 })]);
    expect(sonuc.map((s) => s.id)).toEqual([3]);
  });

  it("model başına tek temsilci (en yüksek puanlı)", () => {
    const sonuc = kurasyonYap([
      aday({ id: 1, modelId: 7, yorumSayisi: 1, yorumOrtalamasi: 6 }),
      aday({ id: 2, modelId: 7, yorumSayisi: 5, yorumOrtalamasi: 9 }),
    ]);
    expect(sonuc.map((s) => s.id)).toEqual([2]);
  });

  it("yorumu çok ve yüksek olan, yorumsuzdan öne geçer", () => {
    const sonuc = kurasyonYap([aday({ id: 1 }), aday({ id: 2, yorumSayisi: 8, yorumOrtalamasi: 9 })], { globalOrtalama: 8 });
    expect(sonuc[0].id).toBe(2);
  });

  it("yorum yokken veri doluluğu yüksek olan öne geçer", () => {
    const eksik = aday({ id: 1, atifVar: false, attributes: { engine_cc: 1500, power_hp: 100, transmission: "Manuel" } });
    const dolu = aday({ id: 2 });
    expect(kurasyonYap([eksik, dolu])[0].id).toBe(2);
  });

  it("limit uygulanır", () => {
    const l = Array.from({ length: 30 }, (_, i) => aday({ id: 100 + i }));
    expect(kurasyonYap(l, { limit: 12 })).toHaveLength(12);
  });

  it("kategori tavanı: tek kategori vitrini domine etmez, her kategoriden en az 1 girer", () => {
    const oto = Array.from({ length: 20 }, (_, i) => aday({ id: 100 + i, goruntulenme: 50 }));
    const moto = aday({ id: 500, categorySlug: "motosiklet", attributes: { engine_cc: 650, power_hp: 90, moto_type: "naked", fuel_type: "GASOLINE" } });
    const sonuc = kurasyonYap([...oto, moto], { limit: 6, kategoriTavani: 3 });
    expect(sonuc.map((s) => s.id)).toContain(500);
    expect(sonuc.filter((s) => s.id < 500)).toHaveLength(5); // kalan slotlar genel sıradan dolar
  });

  it("sonuç kararlı: giriş sırası değişse de aynı çıktı (rastgelelik yok)", () => {
    const l = Array.from({ length: 15 }, (_, i) => aday({ id: 200 + i }));
    const a = kurasyonYap(l).map((s) => s.id);
    const b = kurasyonYap([...l].reverse()).map((s) => s.id);
    expect(b).toEqual(a);
  });

  it("yeni eklenen araç mevcut vitrini bozmaz (yenilik sinyali yok, eşitlikte hash belirler)", () => {
    const l = Array.from({ length: 12 }, (_, i) => aday({ id: 300 + i }));
    const once = kurasyonYap(l).map((s) => s.id);
    const sonra = kurasyonYap([...l, aday({ id: 9999, atifVar: false })]).map((s) => s.id);
    expect(sonra.filter((id) => id !== 9999)).toEqual(once.filter((id) => sonra.includes(id)));
  });
});

describe("kararliHash", () => {
  it("aynı id aynı değeri verir, 0–1 aralığında", () => {
    expect(kararliHash(42)).toBe(kararliHash(42));
    for (const id of [1, 2, 3, 1000, 99999]) { const h = kararliHash(id); expect(h).toBeGreaterThanOrEqual(0); expect(h).toBeLessThan(1); }
  });
});
