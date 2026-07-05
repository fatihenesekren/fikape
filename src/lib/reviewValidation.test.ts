import { describe, it, expect } from "vitest";
import { validateSummary, validateDetail, validateDetailShort } from "./reviewValidation";

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

describe("validateDetail", () => {
  it("boş metni opsiyonel olarak kabul eder", () => {
    expect(validateDetail("").ok).toBe(true);
  });

  it("50 karakterden kısa metni reddeder", () => {
    expect(validateDetail("kısa metin").ok).toBe(false);
  });
});

describe("validateDetailShort", () => {
  it("280 karakterden uzun metni reddeder", () => {
    expect(validateDetailShort("a".repeat(281)).ok).toBe(false);
  });

  it("boş metni opsiyonel olarak kabul eder", () => {
    expect(validateDetailShort("").ok).toBe(true);
  });
});
