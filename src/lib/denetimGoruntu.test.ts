import { describe, expect, it } from "vitest";
import { eylemRengi, tarihAltSiniri, kisaZaman } from "./denetimGoruntu";

describe("eylemRengi", () => {
  it.each([
    ["PRODUCT_CREATE", "yesil"], ["USER_UNBAN", "yesil"], ["SUGGESTION_APPROVE", "yesil"], ["OVERRIDE_RESTORE", "yesil"],
    ["USER_BAN", "kirmizi"], ["PRODUCT_DELETE", "kirmizi"], ["SUGGESTION_REJECT", "kirmizi"], ["PRODUCT_DEACTIVATE", "kirmizi"],
    ["OVERRIDE_HIDE", "sari"], ["PRODUCT_UPDATE", "mavi"], ["BRAND_MERGE", "mavi"], ["CACHE_TEMIZLE", "gri"], ["LEAD_PHONE_REVEAL", "mor"],
  ])("%s → %s", (a, r) => expect(eylemRengi(a)).toBe(r));
  it("bilinmeyen işlem mavi", () => expect(eylemRengi("YENI_ISLEM")).toBe("mavi"));
});

describe("tarihAltSiniri", () => {
  const simdi = Date.UTC(2026, 9, 16, 12, 0, 0);
  it("süreli seçenekler geçmiş bir sınır döner", () => {
    expect(tarihAltSiniri("24s", simdi)?.getTime()).toBe(simdi - 24 * 3600_000);
    expect(tarihAltSiniri("7g", simdi)?.getTime()).toBe(simdi - 7 * 24 * 3600_000);
  });
  it("tum, boş ve bilinmeyen değer sınırsız (null)", () => {
    expect(tarihAltSiniri("tum", simdi)).toBeNull();
    expect(tarihAltSiniri(undefined, simdi)).toBeNull();
    expect(tarihAltSiniri("x'; drop", simdi)).toBeNull();
  });
});

describe("kisaZaman", () => {
  it("saniyesiz gün.ay.yıl saat:dakika", () => {
    expect(kisaZaman(new Date(2026, 9, 11, 18, 37, 9))).toMatch(/^11\.10\.2026.*18:37$/);
  });
});
