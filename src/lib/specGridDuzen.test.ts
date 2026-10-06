import { describe, expect, it } from "vitest";
import { UZUN_DEGER_ESIGI, kisaUzunAyir } from "./specGridDuzen";

const it_ = (label: string, value: string) => ({ label, value });

describe("kisaUzunAyir", () => {
  it("eşik 28 karakter", () => {
    expect(UZUN_DEGER_ESIGI).toBe(28);
  });
  it("kısa değerler (≤28) kısa grupta kalır", () => {
    const { kisa, uzun } = kisaUzunAyir([it_("Isıtma", "Gazlı (Truma/LPG)"), it_("Çekiş", "FWD (Önden Çekiş)"), it_("Sınır", "a".repeat(28))]);
    expect(kisa).toHaveLength(3);
    expect(uzun).toHaveLength(0);
  });
  it("28 karakterden uzun değer uzun gruba gider", () => {
    const yatak = "Ana yatak 122×193 cm + dönüşebilir dinette yatak 102×231 cm";
    const { kisa, uzun } = kisaUzunAyir([it_("Uzunluk", "582 cm"), it_("Yatak Düzeni", yatak), it_("Genişlik", "244 cm")]);
    expect(kisa.map((i) => i.label)).toEqual(["Uzunluk", "Genişlik"]);
    expect(uzun.map((i) => i.label)).toEqual(["Yatak Düzeni"]);
  });
  it("29 karakter uzun sayılır, grupların kendi içinde özgün sıra korunur", () => {
    const { kisa, uzun } = kisaUzunAyir([it_("A", "x".repeat(29)), it_("B", "1"), it_("C", "y".repeat(40)), it_("D", "2")]);
    expect(uzun.map((i) => i.label)).toEqual(["A", "C"]);
    expect(kisa.map((i) => i.label)).toEqual(["B", "D"]);
  });
  it("Türkçe/özel karakterler karakter sayısıyla ölçülür (bayt değil)", () => {
    // 28 karakter: "ğ" tekrarlı (UTF-8'de 2 bayt) — bayt sayılsaydı uzun sayılırdı
    expect(kisaUzunAyir([it_("T", "ğ".repeat(28))]).kisa).toHaveLength(1);
  });
  it("boş liste", () => {
    expect(kisaUzunAyir([])).toEqual({ kisa: [], uzun: [] });
  });
});
