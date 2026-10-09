import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { ARAC_HAVUZU_ETIKETI } from "@/lib/cacheEtiketleri";

// /araclar için kategori havuzu: aktif tüm araçlar, YALNIZ listeleme/filtre için gereken sütunlarla.
// (Önceden marka/model/kategori tabloları ve yorum sayısı dahil her şey çekiliyordu; yorum sayısı hiç kullanılmıyordu.)
//
// Önbellek: etiketli + 120 sn. Araç ekleme/düzeltme/pasife alma/yeniden adlandırma, özellik ve görsel düzenleme
// ARAC_HAVUZU_ETIKETI'ni temizler; temizlemeyi unutan bir yol (betikler, elle DB düzenlemesi) en geç 120 sn sonra görünür.
// Not: Next veri önbelleği tek girdi için ~2 MB sınırı koyar; büyürse girdi önbelleğe yazılmaz, sorgu her seferinde çalışır (işlev bozulmaz).
export const HAVUZ_TTL_SN = 120;

async function havuzuGetir(catSlug: string) {
  return prisma.product.findMany({
    where: { isActive: true, ...(catSlug ? { category: { slug: catSlug } } : {}) },
    select: {
      id: true,
      slug: true,
      name: true,
      year: true,
      trimName: true,
      imageUrl: true,
      attributes: true,
      brand: { select: { slug: true, name: true } },
      model: { select: { name: true } },
      category: { select: { slug: true } },
    },
    orderBy: [{ brand: { name: "asc" } }, { model: { name: "asc" } }, { year: "desc" }],
  });
}

const havuzuOnbellekli = unstable_cache(havuzuGetir, ["arac-havuzu-v1"], {
  revalidate: HAVUZ_TTL_SN,
  tags: [ARAC_HAVUZU_ETIKETI],
});

/** Kategori havuzu ("" = tüm kategoriler). */
export function getAracHavuzu(catSlug?: string) {
  return havuzuOnbellekli(catSlug ?? "");
}

export type HavuzUrunu = Awaited<ReturnType<typeof getAracHavuzu>>[number];

/** Basit süre ölçer: `const gecen = sureOlc(); ... gecen()` → başlangıçtan beri ms (yuvarlak). Bileşenlerde saat okumamak için burada. */
export function sureOlc(): () => number {
  const baslangic = performance.now();
  return () => Math.round(performance.now() - baslangic);
}

/** Yavaşlama/büyüme eşikleri: toplam süre (ms) ya da havuz boyutu. */
export const OLCUM_YAVAS_MS = 800;
export const OLCUM_BUYUK_HAVUZ = 1500;
