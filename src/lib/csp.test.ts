import { describe, expect, it } from "vitest";
import { cspOlustur } from "./csp";

const temel = { uretim: true, onizleme: false, blobHost: "magaza.public.blob.vercel-storage.com" };

describe("cspOlustur", () => {
  it("nonce'suz politika script-src'de unsafe-inline içerir, nonce içermez", () => {
    const p = cspOlustur(temel);
    expect(p).toContain("script-src 'self' 'unsafe-inline'");
    expect(p).not.toContain("nonce-");
    expect(p).not.toContain("script-src-attr");
  });

  it("nonce'lu politikada unsafe-inline yok, strict-dynamic ve script-src-attr none var", () => {
    const p = cspOlustur({ ...temel, nonce: "abc123" });
    expect(p).toContain("script-src 'self' 'nonce-abc123' 'strict-dynamic'");
    expect(p).not.toMatch(/script-src[^;]*unsafe-inline/);
    expect(p).toContain("script-src-attr 'none'");
  });

  it("üretimde unsafe-eval yok, geliştirmede var; önizlemede vercel.live eklenir", () => {
    expect(cspOlustur(temel)).not.toContain("unsafe-eval");
    expect(cspOlustur({ ...temel, uretim: false })).toContain("'unsafe-eval'");
    expect(cspOlustur({ ...temel, onizleme: true })).toContain("https://vercel.live");
  });

  it("Blob hostu tam host olarak img-src ve connect-src'ye girer", () => {
    const p = cspOlustur(temel);
    expect(p).toContain("https://magaza.public.blob.vercel-storage.com");
    expect(p).not.toContain("https://*.public.blob");
  });
});
