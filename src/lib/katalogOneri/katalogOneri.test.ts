import { describe, expect, it } from "vitest";
import { adaylariBirlestir, adaylariDogrula, istemHazirla, norm, type AdayHam, type AramaSonucu } from "./cikarim";
import { kaynakKademe, turkiyeKaniti } from "./kaynak";
import { KIRILIMLAR, ayParcala, kirilimBul, sorguHazirla } from "./kirilimlar";
import { adayAnahtari, etiketle, sec, skorla, type EtiketliAday } from "./suzgec";
import { resmiKataloqdaVar } from "./uret";

const oto = kirilimBul("otomobil")!;
const scooter = kirilimBul("e-scooter")!;

describe("kirilimlar", () => {
  it("9 kırılım ve benzersiz anahtar", () => {
    expect(KIRILIMLAR).toHaveLength(9);
    expect(new Set(KIRILIMLAR.map((k) => k.key)).size).toBe(9);
  });
  it("ay/yıl yer tutucuları dolar", () => {
    expect(ayParcala("2026-11")).toEqual({ ay: "Kasım", yil: 2026 });
    expect(sorguHazirla(oto, "2026-11").join(" ")).toContain("Kasım 2026");
    expect(() => ayParcala("2026-13")).toThrow();
  });
  it("e-scooter / e-bisiklet / elektrikli motosiklet yalnız resmî kaynak", () => {
    expect(KIRILIMLAR.filter((k) => k.sadeceResmi).map((k) => k.key).sort()).toEqual(["e-bisiklet", "e-scooter", "elektrikli-motosiklet"]);
  });
});

describe("kaynakKademe", () => {
  it("marka .com.tr sitesi A", () => {
    expect(kaynakKademe("https://www.renault.com.tr/yeni-modeller/x", "Renault")).toBe("A");
    expect(kaynakKademe("https://www.togg.com.tr/t10f", "Togg")).toBe("A");
  });
  it("marka alan adı ama Türkiye değil → A değil", () => {
    expect(kaynakKademe("https://www.renault.com/en/news", "Renault")).toBeNull();
    expect(kaynakKademe("https://www.bmw.com/tr/new", "BMW")).toBe("A");
  });
  it("büyük yayın B, forum/ilan/sosyal medya elenir", () => {
    expect(kaynakKademe("https://www.hurriyet.com.tr/otomobil/x", "Fiat")).toBe("B");
    expect(kaynakKademe("https://forum.donanimhaber.com/x", "Fiat")).toBeNull();
    expect(kaynakKademe("https://www.sahibinden.com/x", "Fiat")).toBeNull();
    expect(kaynakKademe("https://www.youtube.com/watch?v=1", "Fiat")).toBeNull();
    expect(kaynakKademe("https://blog.bilinmeyen.com/x", "Fiat")).toBeNull();
  });
  it("geçersiz URL → null", () => {
    expect(kaynakKademe("javascript:alert(1)", "Fiat")).toBeNull();
    expect(kaynakKademe("bu bir url değil", "Fiat")).toBeNull();
  });
  it("Türkiye kanıtı: .tr ya da metinde işaret", () => {
    expect(turkiyeKaniti("https://x.com.tr/a", "")).toBe(true);
    expect(turkiyeKaniti("https://x.com/a", norm("Türkiye'de satışa çıkıyor"))).toBe(true);
    expect(turkiyeKaniti("https://x.com/a", norm("Launched in Germany"))).toBe(false);
  });
});

const kaynaklar: AramaSonucu[] = [
  {
    title: "Yeni Renault Rafale Türkiye'de",
    url: "https://www.hurriyet.com.tr/otomobil/rafale",
    content: "Renault Rafale Kasım 2026'da Türkiye'de satışa çıkıyor. Fiyatı 1.900.000 TL'den başlıyor.",
  },
  {
    title: "Global launch",
    url: "https://www.hurriyet.com.tr/otomobil/xyz",
    content: "Fabrika Almanya'da yeni modeli tanıttı.",
  },
];

describe("adaylariDogrula", () => {
  const iyi = { marka: "Renault", model: "Rafale", versiyon: null, yil: 2026, tarihNotu: "Kasım 2026", kaynakNo: 0, kanit: "Renault Rafale Kasım 2026'da Türkiye'de satışa çıkıyor" };
  it("doğru satırı kaynak URL'siyle kabul eder", () => {
    const r = adaylariDogrula([iyi], kaynaklar, oto);
    expect(r).toHaveLength(1);
    expect(r[0]).toMatchObject({ kaynakUrl: "https://www.hurriyet.com.tr/otomobil/rafale", kademe: "B", kaynakAdi: "hurriyet.com.tr" });
  });
  it("alıntı kaynakta yoksa eler (uydurma)", () => {
    expect(adaylariDogrula([{ ...iyi, kanit: "Rafale yarın Türkiye'de bedava dağıtılacak" }], kaynaklar, oto)).toEqual([]);
  });
  it("marka/model kaynakta yoksa eler", () => {
    expect(adaylariDogrula([{ ...iyi, model: "Clio" }], kaynaklar, oto)).toEqual([]);
  });
  it("geçersiz kaynakNo / Türkiye kanıtı yok → eler", () => {
    expect(adaylariDogrula([{ ...iyi, kaynakNo: 9 }], kaynaklar, oto)).toEqual([]);
    const yabanci: AramaSonucu[] = [{ title: "x", url: "https://www.hurriyet.com", content: "Renault Rafale launched in Germany today" }];
    expect(adaylariDogrula([{ ...iyi, kanit: "Renault Rafale launched in Germany today" }], yabanci, oto)).toEqual([]);
  });
  it("sadeceResmi kırılımda B kademesi elenir", () => {
    expect(adaylariDogrula([iyi], kaynaklar, scooter)).toEqual([]);
  });
  it("şema dışı çıktı → boş", () => {
    expect(adaylariDogrula({ x: 1 }, kaynaklar, oto)).toEqual([]);
    expect(adaylariDogrula([{ marka: "A" }], kaynaklar, oto)).toEqual([]);
  });
  it("istem kaynak numaralarını ve kuralları içerir", () => {
    const s = istemHazirla(oto, kaynaklar);
    expect(s).toContain("[0] Yeni Renault Rafale");
    expect(s).toContain("uydurma");
  });
});

const ham = (o: Partial<AdayHam>): AdayHam => ({
  marka: "Fiat", model: "Grande Panda", versiyon: null, yil: 2026, tarihNotu: null,
  kaynakUrl: "https://www.fiat.com.tr/x", kaynakAdi: "fiat.com.tr", kademe: "A", kanit: "kanit kanit kanit", ...o,
});

describe("suzgec", () => {
  it("anahtar aksan/büyük harfe duyarsız", () => {
    expect(adayAnahtari("Citroën", "C-Elysée")).toBe(adayAnahtari("citroen", "c elysee"));
  });
  it("aynı aracı birleştirir, A üstün gelir", () => {
    const r = adaylariBirlestir([ham({ kademe: "B" }), ham({ kademe: "A", kaynakUrl: "https://www.fiat.com.tr/a" })]);
    expect(r).toHaveLength(1);
    expect(r[0].kademe).toBe("A");
  });
  it("bilinen (önceki/reddedilmiş) aday elenir, var etiketi taşınır", () => {
    const adaylar = [ham({}), ham({ model: "Pandina" }), ham({ model: "Topolino" })];
    const r = etiketle(adaylar, new Set([adayAnahtari("Fiat", "Pandina")]), (a) => (a.model === "Topolino" ? { var: true, urunId: 7 } : { var: false, urunId: null }), 2026);
    expect(r.map((x) => x.model)).toEqual(["Grande Panda", "Topolino"]);
    expect(r[1]).toMatchObject({ katalogdaVar: true, mevcutUrunId: 7 });
  });
  it("skor: A > B, güncel yıl artırır", () => {
    expect(skorla({ kademe: "A", yil: null, tarihNotu: null }, 2026)).toBeGreaterThan(skorla({ kademe: "B", yil: null, tarihNotu: null }, 2026));
    expect(skorla({ kademe: "B", yil: 2027, tarihNotu: null }, 2026)).toBeGreaterThan(skorla({ kademe: "B", yil: 2025, tarihNotu: null }, 2026));
  });
  it("seçim: en çok 3 yeni + ayrı 3 'var'; var olan yeni kontenjanını işgal etmez", () => {
    const e = (i: number, v: boolean, skor: number): EtiketliAday => ({ ...ham({ model: `M${i}` }), anahtar: `m${i}`, skor, katalogdaVar: v, mevcutUrunId: null });
    const sonuc = sec([e(1, false, 10), e(2, false, 30), e(3, false, 20), e(4, false, 5), e(5, true, 99), e(6, true, 1)]);
    expect(sonuc.filter((x) => !x.katalogdaVar).map((x) => x.anahtar)).toEqual(["m2", "m3", "m1"]);
    expect(sonuc.filter((x) => x.katalogdaVar).map((x) => x.anahtar)).toEqual(["m5", "m6"]);
  });
});

describe("resmiKataloqdaVar", () => {
  it("var olan marka+model (nesil ayrıntısına duyarsız)", () => {
    expect(resmiKataloqdaVar("otomobil", "Abarth", "500")).toBe(true);
    expect(resmiKataloqdaVar("otomobil", "abarth", "500e")).toBe(true);
  });
  it("olmayan model / marka / kategori", () => {
    expect(resmiKataloqdaVar("otomobil", "Abarth", "Olmayan Model")).toBe(false);
    expect(resmiKataloqdaVar("otomobil", "Olmayan Marka", "X")).toBe(false);
    expect(resmiKataloqdaVar("karavan", "Hobby", "X")).toBe(false);
  });
});

import { ilkPazartesiAyi, AY_BICIMI } from "./zaman";
import { oneriSatirlari } from "./rapor";
import { renderWeeklyReportHtml, renderWeeklyReportText } from "@/lib/reports/render";
import type { WeeklyReportData } from "@/lib/reports/collect";

describe("zaman", () => {
  it("ayın ilk Pazartesi'si", () => {
    expect(ilkPazartesiAyi(new Date("2026-11-02T03:30:00Z"))).toBe("2026-11");
    expect(ilkPazartesiAyi(new Date("2026-11-09T03:30:00Z"))).toBeNull();
    expect(ilkPazartesiAyi(new Date("2026-11-03T03:30:00Z"))).toBeNull();
    expect(ilkPazartesiAyi(new Date("2026-12-07T05:00:00Z"))).toBe("2026-12");
  });
  it("ay biçimi", () => {
    expect(AY_BICIMI.test("2026-11")).toBe(true);
    expect(AY_BICIMI.test("2026-13")).toBe(false);
    expect(AY_BICIMI.test("2026-1")).toBe(false);
  });
});

describe("rapor bölümü", () => {
  const satir = (o: Record<string, unknown>) => ({
    kirilim: "otomobil", marka: "Renault", model: "Rafale", versiyon: null, yil: 2026, tarihNotu: "Kasım 2026",
    kaynakUrl: "https://www.renault.com.tr/rafale", kaynakAdi: "renault.com.tr", kaynakKademe: "A", skor: 20, katalogdaVar: false, ...o,
  });
  const rows = oneriSatirlari([satir({}), satir({ marka: "Fiat", model: "Panda", katalogdaVar: true, skor: 99, kaynakKademe: "B" })]);

  it("9 kırılımın hepsi görünür; boş olan 'aday bulunamadı' der", () => {
    expect(rows.filter((r) => r[0].t !== "")).toHaveLength(9);
    expect(rows.find((r) => r[0].t === "E-scooter")![1].t).toBe("— aday bulunamadı");
  });
  it("yeni aday önce, katalogda var olan sonra ve etiketli", () => {
    const oto = rows.filter((r) => r[0].t === "Otomobil" || r[0].t === "").slice(0, 2);
    expect(oto[0][1].t).toContain("Renault Rafale 2026 (Kasım 2026)");
    expect(oto[1][1].t).toContain("KATALOGDA VAR");
    expect(oto[0][2]).toMatchObject({ t: "A · renault.com.tr", href: "https://www.renault.com.tr/rafale" });
  });
  it("HTML'de bağlantı, metinde URL; javascript: bağlantısı render edilmez", () => {
    const data = {
      isoWeek: "2026-W44", rangeLabel: "26 Eki – 1 Kas", weekStartIso: "", weekEndIso: "", generatedAtIso: "", snapshotMissing: false, quietWeek: false,
      headline: [{ label: "Yeni üye", value: 1, prev: 1, goodDir: "up" as const }], actionLine: "Moderasyon: 0",
      sections: [{ title: "T", head: ["a", "b", "c"], rows: [[{ t: "x" }, { t: "y" }, { t: "z", href: "javascript:alert(1)" }], ...rows.slice(0, 1)] }],
      sectionErrors: [],
    } as WeeklyReportData;
    const html = renderWeeklyReportHtml(data);
    expect(html).not.toContain("javascript:");
    expect(html).toContain('href="https://www.renault.com.tr/rafale"');
    expect(renderWeeklyReportText(data)).toContain("<https://www.renault.com.tr/rafale>");
  });
});
