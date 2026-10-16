import { describe, expect, it } from "vitest";
import { bildirimLinkiGuvenli } from "./bildirimLinki";

describe("bildirimLinkiGuvenli", () => {
  it("göreli yolları korur", () => {
    expect(bildirimLinkiGuvenli("/takas/mesajlar/5?x=1")).toBe("/takas/mesajlar/5?x=1");
  });
  it.each(["https://evil.com", "//evil.com", "/\\evil.com", "javascript:alert(1)", "evil", "", "/a\nb"])("reddeder: %s", (l) => {
    expect(bildirimLinkiGuvenli(l)).toBe("/bildirimler");
  });
  it("null/undefined için varsayılan", () => {
    expect(bildirimLinkiGuvenli(null)).toBe("/bildirimler");
  });
});
