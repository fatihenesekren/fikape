import { del } from "@vercel/blob";
import { prisma } from "@/lib/prisma";
import { isOwnBlobHost } from "./blobUrl";
import { computePHash, findDuplicatePair } from "./phash";
import { fotoyuSinirliIndir } from "./reviewPhotos";

export const MAX_TRADE_PHOTOS = 5;

// Yüklenen blob URL'i gerçekten bizim takas foto yolumuzda mı — istemciden
// gelen keyfi bir URL'nin doğrudan DB'ye yazılmasını önler (review-photo
// route'unun pathname whitelist'iyle aynı ilke, ama burada kayıt anında).
export function isTradePhotoUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return (
      u.protocol === "https:" &&
      isOwnBlobHost(u.hostname) &&
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
        // Zaman aşımı + boyut sınırı + yönlendirme yasağı (sunucu belleği/maliyeti ve SSRF'e karşı)
        return await computePHash(await fotoyuSinirliIndir(url));
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

/** Bu adreslerden hangileri DB'de (başka bir ilan dahil) zaten bir fotoğraf kaydına bağlı? haricIlanId: kendi ilanı sayılmaz. */
export async function kullanimdaTradeFotoUrlleri(urls: string[], haricIlanId?: number): Promise<Set<string>> {
  if (urls.length === 0) return new Set();
  const rows = await prisma.tradeListingPhoto.findMany({
    where: { url: { in: urls }, ...(haricIlanId != null ? { tradeListingId: { not: haricIlanId } } : {}) },
    select: { url: true },
  });
  return new Set(rows.map((r) => r.url));
}

// Blob'ları best-effort siler — cron / hesap silme / kullanıcı foto kaldırma
// akışlarında kullanılır. Prisma transaction'ı DIŞINDA çağrılmalı (harici ağ).
export async function deleteTradePhotoBlobs(urls: string[]) {
  if (urls.length === 0) return;
  // Hâlâ başka bir kayda bağlı olan blob silinmez (başkasının fotoğrafını kendi kaydına ekleyip silme saldırısına karşı)
  const kullanimda = await prisma.tradeListingPhoto.findMany({ where: { url: { in: urls } }, select: { url: true } });
  const tutulacak = new Set(kullanimda.map((r) => r.url));
  await Promise.allSettled(urls.filter((u) => !tutulacak.has(u)).map((u) => del(u)));
}
