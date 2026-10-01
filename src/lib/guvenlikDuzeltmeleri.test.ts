import { afterEach, describe, expect, it } from "vitest";
import { cronYetkili } from "./cronAuth";
import { jsonLdGuvenli } from "../components/JsonLd";
import { isReviewPhotoUrl, temizYorumFotoUrlleri } from "./reviewPhotos";

describe("cronYetkili", () => {
  const eski = process.env.CRON_SECRET;
  afterEach(() => { process.env.CRON_SECRET = eski; if (eski === undefined) delete process.env.CRON_SECRET; });

  it("CRON_SECRET tanımsızsa 'Bearer undefined' dahil hiçbir başlığı kabul etmez", () => {
    delete process.env.CRON_SECRET;
    expect(cronYetkili("Bearer undefined")).toBe(false);
    expect(cronYetkili("Bearer ")).toBe(false);
    expect(cronYetkili(null)).toBe(false);
  });
  it("doğru sırrı kabul eder, yanlışı reddeder", () => {
    process.env.CRON_SECRET = "gizli-deger";
    expect(cronYetkili("Bearer gizli-deger")).toBe(true);
    expect(cronYetkili("Bearer gizli-degeR")).toBe(false);
    expect(cronYetkili("gizli-deger")).toBe(false);
  });
});

describe("jsonLdGuvenli", () => {
  it("</script> ve < > & karakterlerini kaçışlar, JSON değeri aynı kalır", () => {
    const veri = { reviewBody: "</script><script>alert(1)</script> & <b>" };
    const s = jsonLdGuvenli(veri);
    expect(s).not.toContain("<");
    expect(s).not.toContain(">");
    expect(JSON.parse(s)).toEqual(veri);
  });
});

describe("yorum fotoğraf adresi doğrulama", () => {
  it("yalnız https Blob + /reviews/ yolu", () => {
    expect(isReviewPhotoUrl("https://abc.public.blob.vercel-storage.com/reviews/a-1.jpg")).toBe(true);
    expect(isReviewPhotoUrl("https://abc.public.blob.vercel-storage.com/trade-listings/a.jpg")).toBe(false);
    expect(isReviewPhotoUrl("http://abc.public.blob.vercel-storage.com/reviews/a.jpg")).toBe(false);
    expect(isReviewPhotoUrl("https://169.254.169.254/reviews/a.jpg")).toBe(false);
    expect(isReviewPhotoUrl("https://evil.com/.public.blob.vercel-storage.com/reviews/a.jpg")).toBe(false);
  });
  it("liste: geçersiz ya da çok fazla adres null döner", () => {
    const ok = "https://abc.public.blob.vercel-storage.com/reviews/a.jpg";
    expect(temizYorumFotoUrlleri(undefined)).toEqual([]);
    expect(temizYorumFotoUrlleri([ok])).toEqual([ok]);
    expect(temizYorumFotoUrlleri([ok, "https://evil.com/x.jpg"])).toBeNull();
    expect(temizYorumFotoUrlleri(Array(6).fill(ok))).toBeNull();
  });
});
