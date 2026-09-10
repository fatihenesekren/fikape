import { describe, it, expect } from "vitest";
import { renderWeeklyReportHtml, renderWeeklyReportText, reportSubject } from "./render";
import type { WeeklyReportData } from "./collect";

const fixture: WeeklyReportData = {
  isoWeek: "2026-W37",
  rangeLabel: "7–13 Eylül 2026",
  weekStartIso: "2026-09-07T00:00:00.000Z",
  weekEndIso: "2026-09-14T00:00:00.000Z",
  generatedAtIso: "2026-09-14T05:00:00.000Z",
  snapshotMissing: false,
  quietWeek: false,
  headline: [
    { label: "Yeni üye", value: 42, prev: 35, goodDir: "up", sub: "31 doğrulanmış" },
    { label: "Yayınlanan yorum", value: 12, prev: 15, goodDir: "up" },
    { label: "Garaj + favori ekleme", value: 28, prev: 20, goodDir: "up" },
    { label: "Yeni takas ilanı", value: 6, prev: 6, goodDir: "up" },
    { label: "Karşılıklı mesajlaşan konu", value: 3, prev: 1, goodDir: "up" },
    { label: "Yeni lead", value: 4, prev: 2, goodDir: "up" },
    { label: "Haftalık araç görüntüleme", value: 18430, prev: 17050, goodDir: "up" },
  ],
  actionLine: "Moderasyon: 7 yorum + 2 foto + 1 öneri · En eski 9 gün · Silme talebi: 1 · Bekleyen lead: 3",
  sections: [
    {
      title: "Büyüme",
      head: ["Metrik", "Bu hafta", "Δ"],
      rows: [
        [{ t: "Yeni kayıt" }, { t: "42", align: "r", delta: { arrow: "▲", text: "▲ +20% (+7)", color: "up" } }],
        [{ t: "Banlanan hesap" }, { t: "1", align: "r", delta: { arrow: "▲", text: "yeni", color: "down" } }],
      ],
      link: { href: "/admin", label: "Admin" },
    },
    { title: "Trafik", rows: [], note: "veri yok", failed: true },
  ],
  sectionErrors: [],
};

describe("renderWeeklyReportHtml", () => {
  const html = renderWeeklyReportHtml(fixture);

  it("Gmail kırpma bütçesinin altında (< 90KB)", () => {
    expect(Buffer.byteLength(html, "utf8")).toBeLessThan(90_000);
  });
  it("e-posta güvenli — yasak yapılar yok", () => {
    expect(html).not.toMatch(/<script/i);
    expect(html).not.toMatch(/position:/i);
    expect(html).not.toMatch(/display:\s*flex/i);
    expect(html).not.toMatch(/<img/i);
  });
  it("tablo tabanlı + inline stil", () => {
    expect(html).toContain('role="presentation"');
    expect(html).toContain("font-family:Arial,sans-serif");
  });
  it("başlık aralığı + hafta no + aksiyon satırı var", () => {
    expect(html).toContain("7–13 Eylül 2026");
    expect(html).toContain("37. hafta");
    expect(html).toContain("Moderasyon: 7 yorum");
  });
  it("failed bölüm '— veri yok' basar, çökmez", () => {
    expect(html).toContain("veri yok");
  });
  it("kişisel veri yok — e-posta/@/telefon deseni geçmiyor (fixture)", () => {
    expect(html).not.toMatch(/@[a-z0-9.-]+\.[a-z]{2,}/i);
  });
});

describe("renderWeeklyReportText", () => {
  const text = renderWeeklyReportText(fixture);
  it("özet + aksiyon + bölüm başlıkları", () => {
    expect(text).toContain("ÖZET");
    expect(text).toContain("AKSİYON:");
    expect(text).toContain("BÜYÜME");
  });
  it("failed bölüm için '— veri yok'", () => {
    expect(text).toContain("— veri yok");
  });
});

describe("reportSubject", () => {
  it("tarih aralığı + moderasyon + yeni üye taşır", () => {
    const s = reportSubject(fixture);
    expect(s).toContain("[fikape rapor]");
    expect(s).toContain("7–13 Eylül 2026");
    expect(s).toContain("7 moderasyon");
    expect(s).toContain("42 yeni üye");
  });
});
