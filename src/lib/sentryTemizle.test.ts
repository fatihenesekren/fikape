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

  it("gezinti breadcrumb from/to ve Referer başlığını maskeler", () => {
    const o = sentryOlayTemizle({
      request: { headers: { Referer: "https://x.com/a?token=1", referer: "https://x.com/b", "User-Agent": "ua" } },
      breadcrumbs: [{ data: { from: "/a?token=1", to: "/b?email=x@y.com" } }],
    });
    expect(o.request?.headers).toEqual({ "User-Agent": "ua" });
    expect(o.breadcrumbs?.[0].data).toEqual({ from: "/a?token=[gizlendi]", to: "/b?email=[gizlendi]" });
  });

  it("transaction olayında span ve trace özniteliklerindeki token ve istemci IP'sini temizler", () => {
    const o = sentryOlayTemizle({
      type: "transaction",
      contexts: { trace: { data: { "http.url": "https://x.com/api/auth/verify-email?token=SECRET", "http.client_ip": "1.2.3.4", "http.status_code": 200 } } },
      spans: [{ description: "GET https://x.com/api?code=77", data: { "http.query": "?token=SECRET", "http.request.header.cookie": "a=b", "client.address": "1.2.3.4", "db.system": "pg" } }],
    });
    expect(o.contexts?.trace?.data).toEqual({ "http.url": "https://x.com/api/auth/verify-email?token=[gizlendi]", "http.status_code": 200 });
    expect(o.spans?.[0].description).toBe("GET https://x.com/api?code=[gizlendi]");
    expect(o.spans?.[0].data).toEqual({ "http.query": "?token=[gizlendi]", "db.system": "pg" });
  });
});
