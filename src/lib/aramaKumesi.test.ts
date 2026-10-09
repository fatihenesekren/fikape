import { describe, expect, it } from "vitest";
import { aramaLoglansinMi, aramaSonucDurumu, havuzuMotorSirasinaGore } from "./aramaKumesi";

describe("havuzuMotorSirasinaGore", () => {
  const pool = [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }];
  it("yalnız motorun döndürdüğü id'leri, motor sırasıyla verir", () => {
    expect(havuzuMotorSirasinaGore(pool, [3, 1]).map((p) => p.id)).toEqual([3, 1]);
  });
  it("havuzda olmayan id'yi yok sayar", () => {
    expect(havuzuMotorSirasinaGore(pool, [9, 2]).map((p) => p.id)).toEqual([2]);
  });
  it("boş id listesi → boş", () => {
    expect(havuzuMotorSirasinaGore(pool, [])).toEqual([]);
  });
});

describe("aramaSonucDurumu", () => {
  const t = { aramaVar: true, motorSayisi: 5, benzer: false, filtreSonrasi: 5 };
  it("arama yoksa arama-yok", () => {
    expect(aramaSonucDurumu({ ...t, aramaVar: false })).toBe("arama-yok");
  });
  it("motor sıfır → arama-bos", () => {
    expect(aramaSonucDurumu({ ...t, motorSayisi: 0, filtreSonrasi: 0 })).toBe("arama-bos");
  });
  it("filtre hepsini elediyse filtre-bos (öner daveti çıkmaz)", () => {
    expect(aramaSonucDurumu({ ...t, filtreSonrasi: 0 })).toBe("filtre-bos");
  });
  it("benzer / tam", () => {
    expect(aramaSonucDurumu({ ...t, benzer: true })).toBe("arama-benzer");
    expect(aramaSonucDurumu(t)).toBe("arama-var");
  });
});

describe("aramaLoglansinMi", () => {
  const t = { aramaVar: true, sayfa: 1, markaSecili: false, facetSecili: false };
  it("yalnız 1. sayfa ve filtresiz aramada loglanır", () => {
    expect(aramaLoglansinMi(t)).toBe(true);
    expect(aramaLoglansinMi({ ...t, aramaVar: false })).toBe(false);
    expect(aramaLoglansinMi({ ...t, sayfa: 2 })).toBe(false);
    expect(aramaLoglansinMi({ ...t, markaSecili: true })).toBe(false);
    expect(aramaLoglansinMi({ ...t, facetSecili: true })).toBe(false);
  });
});
