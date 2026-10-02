import { describe, expect, it } from "vitest";
import { legacySuz, markaDosyasiSuz, markalariSuz, overrideAnahtarlari, type GizliKayit } from "./override";
import type { KatalogMarkaDosyasi, KatalogTip } from "./tipler";
import type { LegacyMake } from "./ek";

const tip = (v: string, p: string | null, e = false): KatalogTip => ({ v, hp: null, p, k: null, y: [2020], f: null, t: null, ...(e ? { e: true } : {}) });
const dosya: KatalogMarkaDosyasi = {
  marka: "Fiat", kategori: "otomobil", kaynak: "t",
  modeller: [
    { ad: "Egea", nesiller: [], tipler: [tip("1.4 Fire", "Easy"), tip("1.4 Fire", "Lounge"), tip("1.6 Mjet", "Easy"), tip("1.3 Mjet", "Easy", true)] },
    { ad: "Doblo", nesiller: [], tipler: [tip("1.6", null)] },
  ],
};
const g = (scope: GizliKayit["scope"], b: string, m = "", v = "", p = ""): GizliKayit => ({ scope, ...overrideAnahtarlari({ marka: b, model: m, versiyon: v, paket: p }) && { b: overrideAnahtarlari({ marka: b }).brandKey, m: overrideAnahtarlari({ marka: b, model: m }).modelKey, v: overrideAnahtarlari({ marka: b, versiyon: v }).versiyonKey, p: overrideAnahtarlari({ marka: b, paket: p }).paketKey } });

describe("override süzme", () => {
  it("anahtarlar aksan/büyük-küçük harfe duyarsız", () => {
    expect(overrideAnahtarlari({ marka: "Citroën", model: "C-Elysée" })).toMatchObject({ brandKey: "CITROEN", modelKey: "CELYSEE" });
  });
  it("gizli yokken girdiyi aynen döndürür", () => {
    expect(markaDosyasiSuz(dosya, [])).toBe(dosya);
    expect(markalariSuz([{ marka: "A" }], [])).toEqual([{ marka: "A" }]);
  });
  it("marka gizlenince statik dosya null olur ve listeden çıkar", () => {
    const gz = [g("BRAND", "fiat")];
    expect(markaDosyasiSuz(dosya, gz)).toBeNull();
    expect(markalariSuz([{ marka: "Fiat" }, { marka: "BMW" }], gz)).toEqual([{ marka: "BMW" }]);
  });
  it("model gizlenir, girdi değişmez", () => {
    const r = markaDosyasiSuz(dosya, [g("MODEL", "Fiat", "Doblo")])!;
    expect(r.modeller.map((m) => m.ad)).toEqual(["Egea"]);
    expect(dosya.modeller).toHaveLength(2);
  });
  it("versiyon gizlenince tüm donanımları, donanım gizlenince yalnız o donanım kalkar", () => {
    const v = markaDosyasiSuz(dosya, [g("TRIM", "Fiat", "Egea", "1.4 Fire")])!;
    expect(v.modeller[0].tipler.map((t) => `${t.v}|${t.p}`)).toEqual(["1.6 Mjet|Easy", "1.3 Mjet|Easy"]);
    const p = markaDosyasiSuz(dosya, [g("TRIM", "Fiat", "Egea", "1.4 Fire", "Lounge")])!;
    expect(p.modeller[0].tipler.map((t) => `${t.v}|${t.p}`)).toEqual(["1.4 Fire|Easy", "1.6 Mjet|Easy", "1.3 Mjet|Easy"]);
  });
  it("kullanıcı eklemesi (e) resmi gizlemeden etkilenmez", () => {
    const r = markaDosyasiSuz(dosya, [g("TRIM", "Fiat", "Egea", "1.3 Mjet")])!;
    expect(r.modeller[0].tipler.some((t) => t.v === "1.3 Mjet")).toBe(true);
  });
  it("eski liste biçiminde marka/model/versiyon gizlenir; Diğer korunur", () => {
    const makes: LegacyMake[] = [
      { make: "Apollo", models: [{ name: "Air", versions: ["500W", "Diğer"], trims: ["Standart", "Diğer"] }, { name: "Ghost", versions: ["1000W", "Diğer"], trims: ["Diğer"] }] },
      { make: "Zero", models: [{ name: "X", versions: ["Diğer"], trims: ["Diğer"] }] },
    ];
    expect(legacySuz(makes, [g("BRAND", "Zero")]).map((m) => m.make)).toEqual(["Apollo"]);
    const r = legacySuz(makes, [g("MODEL", "Apollo", "Ghost"), g("TRIM", "Apollo", "Air", "500W")]);
    expect(r[0].models.map((m) => m.name)).toEqual(["Air"]);
    expect(r[0].models[0].versions).toEqual(["Diğer"]);
  });
});
