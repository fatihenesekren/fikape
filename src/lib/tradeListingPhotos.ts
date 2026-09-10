import { del } from "@vercel/blob";
import { computePHash, findDuplicatePair } from "./phash";

export const MAX_TRADE_PHOTOS = 5;

// Yüklenen blob URL'i gerçekten bizim takas foto yolumuzda mı — istemciden
// gelen keyfi bir URL'nin doğrudan DB'ye yazılmasını önler (review-photo
// route'unun pathname whitelist'iyle aynı ilke, ama burada kayıt anında).
export function isTradePhotoUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return (
      u.hostname.endsWith(".public.blob.vercel-storage.com") &&
      u.pathname.startsWith("/trade-listings/")
    );
  } catch {
    return false;
  }
}

// Verilen URL'ler için pHash hesapla (best-effort — hata olursa null).
export async function computePhashes(urls: string[]): Promise<(string | null)[]> {
  return Promise.all(
    urls.map(async (url) => {
      try {
        const res = await fetch(url);
        const buffer = Buffer.from(await res.arrayBuffer());
        return await computePHash(buffer);
      } catch {
        return null;
      }
    }),
  );
}

// Aynı fotoğrafın birden çok kez eklenip eklenmediğini kontrol eder.
export function hasDuplicate(phashes: (string | null)[]): boolean {
  return findDuplicatePair(phashes) !== null;
}

// Blob'ları best-effort siler — cron / hesap silme / kullanıcı foto kaldırma
// akışlarında kullanılır. Prisma transaction'ı DIŞINDA çağrılmalı (harici ağ).
export async function deleteTradePhotoBlobs(urls: string[]) {
  if (urls.length === 0) return;
  await Promise.allSettled(urls.map((u) => del(u)));
}
