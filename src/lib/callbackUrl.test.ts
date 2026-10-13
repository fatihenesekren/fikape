import { describe, it, expect } from "vitest";
import { sanitizeCallbackUrl } from "./callbackUrl";

describe("sanitizeCallbackUrl", () => {
  it("site içi yolları korur", () => {
    for (const u of ["/", "/garajim", "/takas-panelim", "/yorum-yaz?arac=toyota-corolla&takas=1", "/takas/12#mesaj", "/%09/evil.com"]) {
      expect(sanitizeCallbackUrl(u)).toBe(u);
    }
  });

  it("boş ya da göreli olmayan değerde ana sayfaya düşer", () => {
    for (const u of [null, undefined, "", "garajim", "https://evil.com", "http://evil.com/x", "javascript:alert(1)"]) {
      expect(sanitizeCallbackUrl(u as string | null)).toBe("/");
    }
  });

  it("protokol-göreli ve ters eğik çizgili harici adresleri reddeder", () => {
    for (const u of ["//evil.com", "/\\evil.com", "/\\/evil.com", "/\\\\evil.com", "/garajim\\..\\evil.com"]) {
      expect(sanitizeCallbackUrl(u)).toBe("/");
    }
  });

  it("kontrol karakterli (sekme, satır sonu) adresleri reddeder", () => {
    for (const u of ["/\t/evil.com", "/\n/evil.com", "/\r/evil.com", "/garajim\u0000", "/\u007fgarajim"]) {
      expect(sanitizeCallbackUrl(u)).toBe("/");
    }
  });
});
