import { afterEach, describe, expect, it } from "vitest";
import { isOwnBlobHost, ownBlobHost } from "./blobUrl";
import { isReviewPhotoUrl } from "./reviewPhotos";
import { isTradePhotoUrl } from "./tradeListingPhotos";
import { isExpertWorkplacePhotoUrl } from "./expertWorkplacePhotos";

const ESKI = { t: process.env.BLOB_READ_WRITE_TOKEN, h: process.env.BLOB_STORE_HOST };
afterEach(() => {
  if (ESKI.t === undefined) delete process.env.BLOB_READ_WRITE_TOKEN; else process.env.BLOB_READ_WRITE_TOKEN = ESKI.t;
  if (ESKI.h === undefined) delete process.env.BLOB_STORE_HOST; else process.env.BLOB_STORE_HOST = ESKI.h;
});

describe("ownBlobHost / isOwnBlobHost", () => {
  it("token'dan mağaza hostunu türetir ve yalnız onu kabul eder", () => {
    delete process.env.BLOB_STORE_HOST;
    process.env.BLOB_READ_WRITE_TOKEN = "vercel_blob_rw_AbC123xyz_gizliDeger";
    expect(ownBlobHost()).toBe("abc123xyz.public.blob.vercel-storage.com");
    expect(isOwnBlobHost("abc123xyz.public.blob.vercel-storage.com")).toBe(true);
    expect(isOwnBlobHost("ABC123XYZ.public.blob.vercel-storage.com")).toBe(true);
    expect(isOwnBlobHost("saldirgan.public.blob.vercel-storage.com")).toBe(false);
    expect(isOwnBlobHost("evil.com")).toBe(false);
  });
  it("BLOB_STORE_HOST önceliklidir", () => {
    process.env.BLOB_READ_WRITE_TOKEN = "vercel_blob_rw_abc_x";
    process.env.BLOB_STORE_HOST = "https://benim.public.blob.vercel-storage.com/";
    expect(ownBlobHost()).toBe("benim.public.blob.vercel-storage.com");
    expect(isOwnBlobHost("abc.public.blob.vercel-storage.com")).toBe(false);
  });
  it("mağaza bilinmiyorsa (yerel geliştirme) yalnız sonek kontrolüne düşer", () => {
    delete process.env.BLOB_READ_WRITE_TOKEN; delete process.env.BLOB_STORE_HOST;
    expect(isOwnBlobHost("herhangi.public.blob.vercel-storage.com")).toBe(true);
    expect(isOwnBlobHost("evil.com")).toBe(false);
  });
  it("üç foto doğrulayıcısı başka mağazayı reddeder", () => {
    delete process.env.BLOB_STORE_HOST;
    process.env.BLOB_READ_WRITE_TOKEN = "vercel_blob_rw_benimmagaza_gizli";
    const ben = "https://benimmagaza.public.blob.vercel-storage.com";
    const o = "https://saldirgan.public.blob.vercel-storage.com";
    expect(isReviewPhotoUrl(`${ben}/reviews/a.jpg`)).toBe(true);
    expect(isReviewPhotoUrl(`${o}/reviews/a.jpg`)).toBe(false);
    expect(isTradePhotoUrl(`${ben}/trade-listings/a.jpg`)).toBe(true);
    expect(isTradePhotoUrl(`${o}/trade-listings/a.jpg`)).toBe(false);
    expect(isTradePhotoUrl(`http://benimmagaza.public.blob.vercel-storage.com/trade-listings/a.jpg`)).toBe(false);
    expect(isExpertWorkplacePhotoUrl(`${ben}/expert-workplace/a.jpg`)).toBe(true);
    expect(isExpertWorkplacePhotoUrl(`${o}/expert-workplace/a.jpg`)).toBe(false);
  });
});
