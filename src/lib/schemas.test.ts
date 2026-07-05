import { describe, it, expect } from "vitest";
import { reviewCreateSchema, registerSchema, vehicleSuggestSchema, questionCreateSchema, answerCreateSchema } from "./schemas";

describe("reviewCreateSchema", () => {
  const valid = {
    productSlug: "toyota-corolla",
    scoreFiyat: 8, scoreKalite: 7, scorePerformans: 6,
    pros: ["reliability"], cons: ["maintenance_cost"],
  };

  it("geçerli bir gövdeyi kabul eder", () => {
    expect(reviewCreateSchema.safeParse(valid).success).toBe(true);
  });

  it("productSlug eksikse reddeder", () => {
    const result = reviewCreateSchema.safeParse({ ...valid, productSlug: "" });
    expect(result.success).toBe(false);
  });

  it("puan aralık dışıysa reddeder", () => {
    const result = reviewCreateSchema.safeParse({ ...valid, scoreFiyat: 11 });
    expect(result.success).toBe(false);
  });

  it("4 pros seçimini reddeder", () => {
    const result = reviewCreateSchema.safeParse({ ...valid, pros: ["a", "b", "c", "d"] });
    expect(result.success).toBe(false);
  });

  it("boş pros/cons dizisini kabul eder (sıfır-sürtünmeli hızlı puan)", () => {
    const result = reviewCreateSchema.safeParse({ ...valid, pros: [], cons: [] });
    expect(result.success).toBe(true);
  });

  it("pros/cons hiç gönderilmezse kabul eder (sıfır-sürtünmeli hızlı puan)", () => {
    const { pros: _pros, cons: _cons, ...withoutChips } = valid;
    const result = reviewCreateSchema.safeParse(withoutChips);
    expect(result.success).toBe(true);
  });
});

describe("registerSchema", () => {
  it("geçerli e-posta+şifreyi kabul eder", () => {
    expect(registerSchema.safeParse({ email: "a@b.com", password: "sifre1234" }).success).toBe(true);
  });

  it("geçersiz e-postayı reddeder", () => {
    expect(registerSchema.safeParse({ email: "gecersiz", password: "sifre1234" }).success).toBe(false);
  });

  it("kısa şifreyi reddeder", () => {
    expect(registerSchema.safeParse({ email: "a@b.com", password: "kisa" }).success).toBe(false);
  });
});

describe("vehicleSuggestSchema", () => {
  const valid = {
    brandName: "Toyota", modelName: "Corolla", categorySlug: "otomobil",
    scoreFiyat: 8, scoreKalite: 7, scorePerformans: 6, summaryText: "Gayet iyi bir araç.",
  };

  it("geçerli bir öneriyi kabul eder", () => {
    expect(vehicleSuggestSchema.safeParse(valid).success).toBe(true);
  });

  it("geçersiz kategoriyi reddeder", () => {
    expect(vehicleSuggestSchema.safeParse({ ...valid, categorySlug: "gemi" }).success).toBe(false);
  });

  it("geçersiz yakıt tipini reddeder", () => {
    expect(vehicleSuggestSchema.safeParse({ ...valid, fuelType: "NUKLEER" }).success).toBe(false);
  });
});

describe("questionCreateSchema", () => {
  const valid = { productSlug: "toyota-corolla", text: "Kışın menzil ne kadar düşüyor?" };

  it("geçerli bir soruyu kabul eder", () => {
    expect(questionCreateSchema.safeParse(valid).success).toBe(true);
  });

  it("çok kısa soruyu reddeder", () => {
    expect(questionCreateSchema.safeParse({ ...valid, text: "Neden?" }).success).toBe(false);
  });

  it("productSlug eksikse reddeder", () => {
    expect(questionCreateSchema.safeParse({ ...valid, productSlug: "" }).success).toBe(false);
  });
});

describe("answerCreateSchema", () => {
  it("geçerli bir cevabı kabul eder", () => {
    expect(answerCreateSchema.safeParse({ text: "Yaklaşık %15 düşüyor." }).success).toBe(true);
  });

  it("çok kısa cevabı reddeder", () => {
    expect(answerCreateSchema.safeParse({ text: "Evet" }).success).toBe(false);
  });
});
