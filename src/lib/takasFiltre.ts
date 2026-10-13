import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { ARAC_HAVUZU_ETIKETI } from "@/lib/cacheEtiketleri";

// /takas filtre seçenekleri (kategori, marka, hangi kategoride hangi marka var).
// Katalog nadiren değişir ama sayfa her istekte üç sorgu çalıştırıyordu; ilan
// trafiği büyüdükçe (menü, bildirim, ana sayfa girişleri) en ucuz kazanım bunları
// önbelleğe almak. Araç/marka ekleme-düzeltme zaten ARAC_HAVUZU_ETIKETI'ni
// temizliyor (admin "Cache Temizle" de bu etiketi kapsar); temizleme unutulursa
// en geç 5 dk sonra görünür.
export const TAKAS_FILTRE_TTL_SN = 300;

async function secenekleriGetir() {
  const [categories, brands, categoryBrandLinks] = await Promise.all([
    prisma.category.findMany({
      where: { isActive: true, parentId: { not: null } },
      select: { id: true, slug: true, name: true },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.brand.findMany({
      where: { isActive: true },
      select: { id: true, slug: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.product.findMany({
      where: { isActive: true },
      select: { categoryId: true, brandId: true, category: { select: { slug: true } }, brand: { select: { slug: true } } },
      distinct: ["categoryId", "brandId"],
    }),
  ]);
  // /takas filtresi slug tabanlı, ilan formu (Garajım, Takas Panelim) id tabanlı harita ister — aynı sorgudan ikisi birden.
  const categoryBrandMap: Record<string, string[]> = {};
  const categoryBrandIdMap: Record<number, number[]> = {};
  for (const link of categoryBrandLinks) {
    (categoryBrandMap[link.category.slug] ??= []).push(link.brand.slug);
    (categoryBrandIdMap[link.categoryId] ??= []).push(link.brandId);
  }
  return { categories, brands, categoryBrandMap, categoryBrandIdMap };
}

export const getTakasFiltreSecenekleri = unstable_cache(secenekleriGetir, ["takas-filtre-v2"], {
  revalidate: TAKAS_FILTRE_TTL_SN,
  tags: [ARAC_HAVUZU_ETIKETI],
});
