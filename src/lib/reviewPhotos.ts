export const MAX_REVIEW_PHOTOS = 5;
const IZINLI_SONEK = ".public.blob.vercel-storage.com";

/**
 * Yorum fotoğrafı adresi gerçekten bizim Blob yolumuzda mı (uploads/review-photo yalnız "reviews/" öneki üretir).
 * İstemciden gelen keyfi adres hem sunucu tarafı istek (SSRF/pHash fetch) hem de saklanan içerik riski taşır.
 */
export function isReviewPhotoUrl(url: unknown): url is string {
  if (typeof url !== "string" || url.length > 500) return false;
  try {
    const u = new URL(url);
    return u.protocol === "https:" && u.hostname.endsWith(IZINLI_SONEK) && u.pathname.startsWith("/reviews/");
  } catch {
    return false;
  }
}

/** Adres listesini doğrular; geçersiz adres varsa null döner (çağıran 400 verir). */
export function temizYorumFotoUrlleri(urls: unknown, max = MAX_REVIEW_PHOTOS): string[] | null {
  if (urls === undefined || urls === null) return [];
  if (!Array.isArray(urls) || urls.length > max) return null;
  return urls.every(isReviewPhotoUrl) ? (urls as string[]) : null;
}

/** pHash için fotoğraf indirme: zaman aşımı + boyut sınırı (bellek tüketimini engeller). */
export async function fotoyuSinirliIndir(url: string, maxBayt = 25 * 1024 * 1024, zamanAsimiMs = 8000): Promise<Buffer> {
  const res = await fetch(url, { signal: AbortSignal.timeout(zamanAsimiMs), redirect: "error" });
  if (!res.ok) throw new Error("indirilemedi");
  const uzunluk = Number(res.headers.get("content-length") ?? 0);
  if (uzunluk > maxBayt) throw new Error("çok büyük");
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length > maxBayt) throw new Error("çok büyük");
  return buf;
}
