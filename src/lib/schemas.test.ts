import { describe, it, expect } from "vitest";
import {
  reviewCreateSchema, registerSchema, vehicleSuggestSchema, questionCreateSchema, answerCreateSchema,
  tradeListingCreateSchema, tradeListingUpdateSchema, tradeListingCloseSchema,
  messageCreateSchema, messageReportSchema,
} from "./schemas";

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
  const validPassword = "Sifre1234!";

  it("geçerli e-posta+şifre+görünen ad+onay kabul eder", () => {
    expect(registerSchema.safeParse({ email: "a@b.com", password: validPassword, displayName: "Ali", consent: true }).success).toBe(true);
  });

  it("geçersiz e-postayı reddeder", () => {
    expect(registerSchema.safeParse({ email: "gecersiz", password: validPassword, displayName: "Ali", consent: true }).success).toBe(false);
  });

  it("kısa şifreyi reddeder", () => {
    expect(registerSchema.safeParse({ email: "a@b.com", password: "kisa", displayName: "Ali", consent: true }).success).toBe(false);
  });

  it("kural setini sağlamayan şifreyi reddeder (büyük/özel karakter yok)", () => {
    expect(registerSchema.safeParse({ email: "a@b.com", password: "sifre1234", displayName: "Ali", consent: true }).success).toBe(false);
  });

  it("görünen ad eksikse reddeder", () => {
    expect(registerSchema.safeParse({ email: "a@b.com", password: validPassword, consent: true }).success).toBe(false);
  });

  it("2 karakterlik görünen adı reddeder", () => {
    expect(registerSchema.safeParse({ email: "a@b.com", password: validPassword, displayName: "Al", consent: true }).success).toBe(false);
  });

  it("sadece rakamdan oluşan görünen adı reddeder", () => {
    expect(registerSchema.safeParse({ email: "a@b.com", password: validPassword, displayName: "12345", consent: true }).success).toBe(false);
  });

  it("harf+rakam karışımı görünen adı reddeder", () => {
    expect(registerSchema.safeParse({ email: "a@b.com", password: validPassword, displayName: "Ahmet35", consent: true }).success).toBe(false);
  });

  it("nokta/tire/boşluk içeren görünen adı kabul eder", () => {
    expect(registerSchema.safeParse({ email: "a@b.com", password: validPassword, displayName: "Ahmet K.", consent: true }).success).toBe(true);
    expect(registerSchema.safeParse({ email: "a@b.com", password: validPassword, displayName: "Ahmet-Can", consent: true }).success).toBe(true);
  });

  it("onay verilmezse reddeder", () => {
    expect(registerSchema.safeParse({ email: "a@b.com", password: validPassword, displayName: "Ali", consent: false }).success).toBe(false);
  });

  it("onay hiç gönderilmezse reddeder", () => {
    expect(registerSchema.safeParse({ email: "a@b.com", password: validPassword, displayName: "Ali" }).success).toBe(false);
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

describe("tradeListingCreateSchema", () => {
  const valid = {
    userProductId: 1, wantAnything: true, paymentIntent: "SWAP_ONLY", city: "İstanbul", consentGiven: true,
  };

  it("geçerli bir ilanı kabul eder", () => {
    expect(tradeListingCreateSchema.safeParse(valid).success).toBe(true);
  });

  it("geçersiz ili reddeder", () => {
    expect(tradeListingCreateSchema.safeParse({ ...valid, city: "Atlantis" }).success).toBe(false);
  });

  it("geçersiz ödeme niyetini reddeder", () => {
    expect(tradeListingCreateSchema.safeParse({ ...valid, paymentIntent: "BARTER" }).success).toBe(false);
  });

  it("KVKK onayı verilmezse reddeder", () => {
    expect(tradeListingCreateSchema.safeParse({ ...valid, consentGiven: false }).success).toBe(false);
  });

  it("KVKK onayı hiç gönderilmezse reddeder", () => {
    const { consentGiven: _consentGiven, ...withoutConsent } = valid;
    expect(tradeListingCreateSchema.safeParse(withoutConsent).success).toBe(false);
  });

  it("300 karakterden uzun notu reddeder", () => {
    expect(tradeListingCreateSchema.safeParse({ ...valid, note: "a".repeat(301) }).success).toBe(false);
  });
});

describe("tradeListingUpdateSchema", () => {
  it("update aksiyonunu kabul eder", () => {
    expect(tradeListingUpdateSchema.safeParse({ action: "update", city: "Ankara" }).success).toBe(true);
  });

  it("reopen aksiyonunu kabul eder", () => {
    expect(tradeListingUpdateSchema.safeParse({ action: "reopen" }).success).toBe(true);
  });

  it("geçersiz aksiyonu reddeder", () => {
    expect(tradeListingUpdateSchema.safeParse({ action: "delete" }).success).toBe(false);
  });

  it("action alanı eksikse reddeder", () => {
    expect(tradeListingUpdateSchema.safeParse({ city: "Ankara" }).success).toBe(false);
  });
});

describe("tradeListingCloseSchema", () => {
  it("geçerli bir kapanış nedenini kabul eder", () => {
    expect(tradeListingCloseSchema.safeParse({ closeReason: "TRADED" }).success).toBe(true);
  });

  it("kapanış nedeni olmadan da kabul eder (opsiyonel)", () => {
    expect(tradeListingCloseSchema.safeParse({}).success).toBe(true);
  });

  it("geçersiz kapanış nedenini reddeder", () => {
    expect(tradeListingCloseSchema.safeParse({ closeReason: "CANCELLED" }).success).toBe(false);
  });
});

describe("messageCreateSchema", () => {
  it("geçerli bir mesajı kabul eder", () => {
    expect(messageCreateSchema.safeParse({ text: "Merhaba, aracınızla ilgileniyorum." }).success).toBe(true);
  });

  it("boş mesajı reddeder", () => {
    expect(messageCreateSchema.safeParse({ text: "" }).success).toBe(false);
  });

  it("1000 karakterden uzun mesajı reddeder", () => {
    expect(messageCreateSchema.safeParse({ text: "a".repeat(1001) }).success).toBe(false);
  });
});

describe("messageReportSchema", () => {
  it("geçerli bir rapor sebebini kabul eder", () => {
    expect(messageReportSchema.safeParse({ reason: "SCAM_ATTEMPT" }).success).toBe(true);
  });

  it("geçersiz rapor sebebini reddeder", () => {
    expect(messageReportSchema.safeParse({ reason: "HACKED" }).success).toBe(false);
  });

  it("not olmadan da kabul eder (opsiyonel)", () => {
    expect(messageReportSchema.safeParse({ reason: "OTHER" }).success).toBe(true);
  });
});
