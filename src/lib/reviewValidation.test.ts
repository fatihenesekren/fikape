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

describe("checkContent — telefon numarası engeli", () => {
  it("boşluklu telefon numarası paylaşımını reddeder", () => {
    const result = checkContent("beni 0532 123 45 67 numarasından arayabilirsin");
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/[Tt]elefon/);
  });

  it("ülke kodlu telefon numarası paylaşımını reddeder", () => {
    const result = checkContent("whatsapp +90 532 123 45 67 üzerinden yazabilirsin");
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/[Tt]elefon/);
  });

  it("boşluksuz telefon numarası paylaşımını reddeder", () => {
    const result = checkContent("hemen 05321234567 numarasını ara");
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/[Tt]elefon/);
  });

  it("km/fiyat gibi normal sayısal metni yanlışlıkla reddetmez (yanlış-pozitif kontrolü)", () => {
    const result = checkContent("aracın kilometresi 95000 ve fiyatı da 750000 TL civarında görünüyor");
    expect(result.ok).toBe(true);
  });
});

describe("checkContent — e-posta / sosyal medya / mesajlaşma engeli", () => {
  it("e-posta adresi paylaşımını reddeder", () => {
    const result = checkContent("bana buradan ulaş ahmet.yilmaz@gmail.com hemen dönerim");
    expect(result.ok).toBe(false);
    expect(result.rule).toBe("EMAIL");
  });

  it("wa.me / t.me kısa linkini reddeder (şemasız)", () => {
    const result = checkContent("detaylar için wa.me/905321234567 üzerinden yazabilirsin bana");
    expect(result.ok).toBe(false);
    expect(result.rule).toBe("MESSAGING_APP");
  });

  it("instagram.com bağlantısını reddeder", () => {
    const result = checkContent("araç fotoları instagram.com/satilikaraba hesabımda mevcut hepsi");
    expect(result.ok).toBe(false);
    expect(result.rule).toBe("MESSAGING_APP");
  });

  it("@kullaniciadi paylaşımını reddeder", () => {
    const result = checkContent("bana ulaşmak için @satilik_araba yazabilirsin oradan dönerim");
    expect(result.ok).toBe(false);
    expect(result.rule).toBe("CONTACT_HANDLE");
  });

  it("strict modda 'whatsapptan yaz' ifadesini reddeder", () => {
    const result = checkContent("müsaitsen whatsapptan yazalım detayları orada konuşuruz", { strict: true });
    expect(result.ok).toBe(false);
    expect(result.rule).toBe("MESSAGING_APP");
  });

  it("strict OLMAYAN modda 'whatsapp' anımını yakalamaz (yanlış-pozitif kontrolü)", () => {
    const result = checkContent("araçta android auto ve whatsapp sesli okuma desteği gayet iyi çalışıyor");
    expect(result.ok).toBe(true);
  });

  it("e-postası olmayan normal metni kabul eder (@ yok, nokta-alan yok)", () => {
    const result = checkContent("bu araç şehir içi ve uzun yolda gerçekten çok konforlu ve ekonomik");
    expect(result.ok).toBe(true);
  });

  it("ilan metnindeki '@45.000 km' ifadesini yanlışlıkla engellemez", () => {
    const result = checkContent("2020 model temiz araç @45.000 km, tramersiz, ilk elden sahibinden");
    expect(result.ok).toBe(true);
  });
});

describe("checkContent — rule alanı", () => {
  it("IBAN tetiklendiğinde rule='IBAN' döner", () => {
    const r = checkContent("hesabım TR33 0006 1005 1978 6457 8413 26 buraya at");
    expect(r.rule).toBe("IBAN");
  });

  it("temiz metinde rule tanımsızdır", () => {
    const r = checkContent("bu araç fiyatına göre gayet başarılı ve keyifli bir sürüş sunuyor");
    expect(r.ok).toBe(true);
    expect(r.rule).toBeUndefined();
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
