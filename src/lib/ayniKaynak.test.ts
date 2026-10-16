import { describe, expect, it } from "vitest";
import { ayniKaynakMi, capraziSiteApiIstegiMi } from "./ayniKaynak";

const istek = (yontem: string, basliklar: Record<string, string> = {}, url = "https://fikape.com/api/x") =>
  new Request(url, { method: yontem, headers: basliklar });

describe("ayniKaynakMi", () => {
  it("aynı kaynak / başlıksız isteği kabul eder, çapraz-siteyi reddeder", () => {
    expect(ayniKaynakMi(istek("POST", { origin: "https://fikape.com" }))).toBe(true);
    expect(ayniKaynakMi(istek("POST", { "sec-fetch-site": "same-origin" }))).toBe(true);
    expect(ayniKaynakMi(istek("POST"))).toBe(true);
    expect(ayniKaynakMi(istek("POST", { origin: "https://evil.com" }))).toBe(false);
    expect(ayniKaynakMi(istek("POST", { "sec-fetch-site": "cross-site" }))).toBe(false);
    expect(ayniKaynakMi(istek("POST", { origin: "null" }))).toBe(false);
  });
});

describe("capraziSiteApiIstegiMi", () => {
  it("GET isteklerine karışmaz", () => {
    expect(capraziSiteApiIstegiMi(istek("GET", { origin: "https://evil.com" }), "/api/x")).toBe(false);
  });
  it("durum değiştiren çapraz-site isteği engeller", () => {
    expect(capraziSiteApiIstegiMi(istek("POST", { origin: "https://evil.com" }), "/api/admin/users/1/ban")).toBe(true);
    expect(capraziSiteApiIstegiMi(istek("PATCH", { "sec-fetch-site": "cross-site" }), "/api/profile")).toBe(true);
    expect(capraziSiteApiIstegiMi(istek("DELETE", { origin: "https://fikape.com" }), "/api/garage")).toBe(false);
  });
  it("Auth.js, cron ve csp-report muaf", () => {
    expect(capraziSiteApiIstegiMi(istek("POST", { origin: "https://evil.com" }), "/api/auth/callback/credentials")).toBe(false);
    expect(capraziSiteApiIstegiMi(istek("POST", { "sec-fetch-site": "cross-site" }), "/api/csp-report")).toBe(false);
    expect(capraziSiteApiIstegiMi(istek("POST", { "sec-fetch-site": "cross-site" }), "/api/cron/weekly-report")).toBe(false);
  });
});
