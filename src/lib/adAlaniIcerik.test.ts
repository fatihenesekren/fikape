import { describe, expect, it } from "vitest";
import { checkContent } from "./reviewValidation";

// Marka/model/donanım adları (vehicle-suggest) için: harf oranı kuralı atlanır ama gizlenmiş telefon yakalanmaya devam eder.
const ad = (t: string) => checkContent(t, { harfOraniAtla: true }).ok;

describe("checkContent harfOraniAtla (araç adı alanları)", () => {
  it.each(["Golf (2012-2019)", "W213 E200 (2016-)", "A4 2.0 TDI quattro 190 (2015)", "Clio 1.5 dCi", "ID.4", "Q4 e-tron"])("meşru ad geçer: %s", (t) => {
    expect(ad(t)).toBe(true);
  });
  it("harf oranı kuralı seçenek olmadan yine uygulanır", () => {
    expect(checkContent("Golf (2012-2019)").ok).toBe(false);
  });
  it.each(["Golf 0532,123,45,67", "Golf 0532/123/45/67", "Golf 532_123_45_67", "Golf 0 5 3 2 1 2 3 4 5 6 7", "Golf 05321234567"])(
    "gizlenmiş telefon reddedilir: %s", (t) => expect(ad(t)).toBe(false),
  );
  it("link ve e-posta diğer kurallarla yine yakalanır", () => {
    expect(ad("Golf wa.me/905321234567")).toBe(false);
    expect(ad("Golf a@b.com")).toBe(false);
  });
});
