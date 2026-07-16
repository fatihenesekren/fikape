import { describe, it, expect } from "vitest";
import { validateSummary, validateDetail, validateDetailShort, checkContent } from "./reviewValidation";

describe("validateSummary", () => {
  it("boş metni reddeder", () => {
    expect(validateSummary("").ok).toBe(false);
  });

  it("20 karakterden kısa metni reddeder", () => {
    expect(validateSummary("çok kısa").ok).toBe(false);
  });

  it("500 karakterden uzun metni reddeder", () => {
    expect(validateSummary("a".repeat(501)).ok).toBe(false);
  });

  it("geçerli bir yorumu kabul eder", () => {
    const result = validateSummary("Bu araç gerçekten fiyatına göre gayet iyi performans veriyor.");
    expect(result.ok).toBe(true);
  });

  it("URL içeren metni reddeder", () => {
    const result = validateSummary("Detaylı incelemem burada https://example.com adresinde bakabilirsiniz.");
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/Link/);
  });

  it("küfür içeren metni reddeder", () => {
    const result = validateSummary("Bu araba tam bir bok gibi çalışıyor, hiç almayın kesinlikle.");
    expect(result.ok).toBe(false);
  });

  it("anlamsız tekrar eden karakterleri reddeder", () => {
    const result = validateSummary("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
    expect(result.ok).toBe(false);
  });
});

describe("checkContent — ayraçlı küfür atlatma düzeltmesi", () => {
  it("nokta ile ayrılmış küfürü reddeder", () => {
    const result = checkContent("bu araba tam bir a.m.k gibi bir şey oldu valla");
    expect(result.ok).toBe(false);
  });

  it("boşlukla ayrılmış küfürü reddeder", () => {
    const result = checkContent("bu araba tam bir a m k gibi bir şey oldu valla");
    expect(result.ok).toBe(false);
  });

  it("normal, küfürsüz bir metni hâlâ kabul eder", () => {
    const result = checkContent("bu araç gerçekten fiyatına göre gayet iyi performans veriyor");
    expect(result.ok).toBe(true);
  });
});

describe("checkContent — IBAN engeli", () => {
  it("boşluklu IBAN paylaşımını reddeder", () => {
    const result = checkContent("hesap bilgim TR33 0006 1005 1978 6457 8413 26 buraya gönderebilirsin");
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/IBAN/);
  });

  it("boşluksuz IBAN paylaşımını reddeder", () => {
    const result = checkContent("hesap bilgim TR330006100519786457841326 buraya gönderebilirsin");
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/IBAN/);
  });

  it("noktalı IBAN paylaşımını reddeder", () => {
    const result = checkContent("hesap bilgim TR33.0006.1005.1978.6457.8413.26 buraya gönderebilirsin");
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/IBAN/);
  });

  it("meşru plaka/şasi içeren normal bir mesajı hâlâ kabul eder (yanlış-pozitif kontrolü)", () => {
    const result = checkContent("aracın plakası 34 ABC 123 ve şasi numarası da elimde mevcut durumda");
    expect(result.ok).toBe(true);
  });
});

describe("validateDetail", () => {
  it("boş metni opsiyonel olarak kabul eder", () => {
    expect(validateDetail("").ok).toBe(true);
  });

  it("50 karakterden kısa metni reddeder", () => {
    expect(validateDetail("kısa metin").ok).toBe(false);
  });
});

describe("validateDetailShort", () => {
  it("500 karakterden uzun metni reddeder", () => {
    expect(validateDetailShort("a".repeat(501)).ok).toBe(false);
  });

  it("boş metni opsiyonel olarak kabul eder", () => {
    expect(validateDetailShort("").ok).toBe(true);
  });
});
