import { describe, expect, it } from "vitest";
import { guvenliTamsayi, temizSearchParams } from "./searchParamsTemiz";

describe("temizSearchParams", () => {
  it("dizi değerlerinin ilkini alır, uzun metni kısaltır, diğer tipleri undefined yapar", () => {
    const r = temizSearchParams({ a: ["x", "y"], b: "z".repeat(500), c: undefined } as unknown as { a?: string; b?: string; c?: string });
    expect(r.a).toBe("x");
    expect(r.b).toHaveLength(200);
    expect(r.c).toBeUndefined();
  });
});

describe("guvenliTamsayi", () => {
  it("aralık dışı ve geçersiz değerleri reddeder", () => {
    expect(guvenliTamsayi("2020")).toBe(2020);
    expect(guvenliTamsayi("99999999999")).toBeUndefined();
    expect(guvenliTamsayi("abc")).toBeUndefined();
    expect(guvenliTamsayi("-5")).toBeUndefined();
    expect(guvenliTamsayi(undefined)).toBeUndefined();
  });
});
