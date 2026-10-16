import { describe, expect, it } from "vitest";
import { sentryOlayTemizle, urlTemizle } from "./sentryTemizle";

describe("sentryTemizle", () => {
  it("URL'deki token/e-posta sorgularını gizler", () => {
    expect(urlTemizle("https://x.com/sifre-sifirla?token=abc123&ref=1")).toBe("https://x.com/sifre-sifirla?token=[gizlendi]&ref=1");
    expect(urlTemizle("https://x.com/p?email=a@b.com")).toBe("https://x.com/p?email=[gizlendi]");
  });
  it("başlık, çerez, gövde ve kullanıcı kimliğini olaydan ayıklar", () => {
    const o = sentryOlayTemizle({
      request: { url: "https://x.com/a?token=zzz", cookies: { s: "1" }, data: { p: "gizli" }, query_string: "token=zzz", headers: { Cookie: "a=b", "User-Agent": "ua", Authorization: "Bearer x" } },
      user: { id: "5", email: "a@b.com", ip_address: "1.2.3.4" },
      breadcrumbs: [{ data: { url: "https://x.com/b?code=77" } }],
    });
    expect(o.request?.url).toContain("[gizlendi]");
    expect(o.request?.cookies).toBeUndefined();
    expect(o.request?.data).toBeUndefined();
    expect(o.request?.headers).toEqual({ "User-Agent": "ua" });
    expect(o.user).toEqual({ id: "5" });
    expect(o.breadcrumbs?.[0].data?.url).toBe("https://x.com/b?code=[gizlendi]");
  });
});
