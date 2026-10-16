import { describe, expect, it } from "vitest";
import { botIstegiMi } from "./botIstegi";

describe("botIstegiMi", () => {
  it("bilinen botları ve UA'sız istekleri yakalar", () => {
    for (const ua of ["Googlebot/2.1", "Mozilla/5.0 (compatible; bingbot/2.0)", "curl/8.4.0", "python-requests/2.31", "facebookexternalhit/1.1", null, ""]) {
      expect(botIstegiMi(ua), String(ua)).toBe(true);
    }
  });
  it("gerçek tarayıcıları geçirir", () => {
    expect(botIstegiMi("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Version/17.0 Mobile Safari/604.1")).toBe(false);
    expect(botIstegiMi("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0 Safari/537.36")).toBe(false);
  });
});
