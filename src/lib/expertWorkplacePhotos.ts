import { del } from "@vercel/blob";
import { prisma } from "@/lib/prisma";
import { isOwnBlobHost } from "./blobUrl";
import { fotoyuSinirliIndir } from "./reviewPhotos";
import { computePHash, findDuplicatePair, hammingDistance, PHASH_DUPLICATE_THRESHOLD } from "./phash";

// Usta profili "çalışma yeri" fotoğrafları — tabelaId/işletme girişi (STOREFRONT,
// en fazla 1) + iç mekan (INTERIOR, en fazla 3). TradeListingPhoto ile aynı
// desen (bkz. lib/tradeListingPhotos.ts) — 3 ajanlı panelin (UX/veri modeli/
// güven-güvenlik) ortak kararı.
export const MAX_STOREFRONT_PHOTOS = 1;
export const MAX_INTERIOR_PHOTOS = 3;

// Yüklenen blob URL'i gerçekten bizim yolumuzda mı — istemciden gelen keyfi
// bir URL'nin doğrudan DB'ye yazılmasını önler (review/trade-photo route'larıyla
// aynı ilke).
export function isExpertWorkplacePhotoUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return (
      u.protocol === "https:" &&
      isOwnBlobHost(u.hostname) &&
      u.pathname.startsWith("/expert-workplace/")
    );
  } catch {
    return false;
  }
}

export async function computePhashes(urls: string[]): Promise<(string | null)[]> {
  return Promise.all(
    urls.map(async (url) => {
      try {
        return await computePHash(await fotoyuSinirliIndir(url));
      } catch {
        return null;
      }
    }),
  );
}

/** Bu adreslerden hangileri DB'de başka bir profile (haricProfilId hariç) zaten bağlı? */
export async function kullanimdaCalismaYeriFotoUrlleri(urls: string[], haricProfilId?: number): Promise<Set<string>> {
  if (urls.length === 0) return new Set();
  const rows = await prisma.expertWorkplacePhoto.findMany({
    where: { url: { in: urls }, ...(haricProfilId != null ? { profileId: { not: haricProfilId } } : {}) },
    select: { url: true },
  });
  return new Set(rows.map((r) => r.url));
}

export function hasDuplicate(phashes: (string | null)[]): boolean {
  return findDuplicatePair(phashes) !== null;
}

// Takastan FARKI: orada aynı ilan içinde tekrar aranıyordu, burada GLOBAL
// arama yapılıyor — amaç iki farklı ustanın "benim işletmem" diye aynı
// fotoğrafı (örn. internetten bulunmuş bir görsel) yüklemesini yakalamak
// (bkz. güven & güvenlik ajanı bulgusu "a" senaryosu). Yalnız PENDING/APPROVED
// kayıtlarla karşılaştırılır — reddedilmiş bir fotoğrafla eşleşme önemsizdir.
export async function findGlobalDuplicateProfileId(
  phash: string,
  excludeProfileId?: number,
): Promise<{ profileId: number; profileSlug: string } | null> {
  const candidates = await prisma.expertWorkplacePhoto.findMany({
    where: {
      phash: { not: null },
      status: { in: ["PENDING", "APPROVED"] },
      ...(excludeProfileId != null ? { profileId: { not: excludeProfileId } } : {}),
    },
    select: { phash: true, profile: { select: { id: true, slug: true } } },
  });
  for (const c of candidates) {
    if (c.phash && hammingDistance(phash, c.phash) <= PHASH_DUPLICATE_THRESHOLD) {
      return { profileId: c.profile.id, profileSlug: c.profile.slug };
    }
  }
  return null;
}

// Blob'ları best-effort siler — kullanıcı fotoğraf kaldırma / hesap silme
// akışlarında kullanılır. Prisma transaction'ı DIŞINDA çağrılmalı (harici ağ).
export async function deleteExpertWorkplacePhotoBlobs(urls: string[]) {
  if (urls.length === 0) return;
  // Hâlâ bir kayda bağlı olan blob silinmez (başkasının fotoğrafını kendi kaydına ekleyip silme saldırısına karşı)
  const kullanimda = await prisma.expertWorkplacePhoto.findMany({ where: { url: { in: urls } }, select: { url: true } });
  const tutulacak = new Set(kullanimda.map((r) => r.url));
  await Promise.allSettled(urls.filter((u) => !tutulacak.has(u)).map((u) => del(u)));
}
