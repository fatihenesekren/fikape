// Onaylı (ACTIVE) araçlardan canlı katalog eklemesi — yalnız sunucu (Prisma). Sonuçlar etiketle önbelleğe
// alınır; admin bir öneriyi onaylayınca "katalog-ek" etiketi geçersiz kılınır (bkz. admin/oneriler/[id]).
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slugify";
import { urunlerdenEk, type EkMarkaVeri, type EkUrun } from "./ek";

export const EK_ETIKET = "katalog-ek";
export const GECERLI_KATEGORILER = ["otomobil", "kamyonet", "motosiklet", "e-scooter", "e-bisiklet", "karavan"] as const;
export type EkKategori = (typeof GECERLI_KATEGORILER)[number];
export const ekKategoriGecerli = (k: string): k is EkKategori => (GECERLI_KATEGORILER as readonly string[]).includes(k);

const SATIR_LIMITI = 3000;

function urunSatiri(p: {
  year: number | null; trimName: string | null; attributes: unknown; model: { name: string };
}): EkUrun {
  const a = (p.attributes && typeof p.attributes === "object" ? p.attributes : {}) as Record<string, unknown>;
  const hp = Number(a.power_hp);
  return {
    modelAd: p.model.name,
    year: p.year,
    trimName: p.trimName,
    fuelType: typeof a.fuel_type === "string" ? a.fuel_type : null,
    transmission: typeof a.transmission === "string" ? a.transmission : null,
    powerHp: Number.isInteger(hp) && hp >= 40 && hp <= 2000 ? hp : null,
  };
}

/** Bir markanın onaylı araçları (model bazında). */
export const getEkMarka = unstable_cache(
  async (kategori: EkKategori, markaSlug: string): Promise<EkMarkaVeri | null> => {
    const brand = await prisma.brand.findUnique({ where: { slug: markaSlug }, select: { name: true } });
    if (!brand) return null;
    const rows = await prisma.product.findMany({
      where: { status: "ACTIVE", isActive: true, category: { slug: kategori }, brand: { slug: markaSlug } },
      select: { year: true, trimName: true, attributes: true, model: { select: { name: true } } },
      take: SATIR_LIMITI,
    });
    // Onaylı ürünü olmayan marka (yalnız bekleyen/reddedilen öneriden doğmuş olabilir) hiç döndürülmez
    if (rows.length === 0) return null;
    return urunlerdenEk(brand.name, rows.map(urunSatiri));
  },
  ["katalog-ek-marka"],
  { tags: [EK_ETIKET], revalidate: 600 },
);

/** Kategorideki onaylı araçların marka adları. */
export const getEkMarkalar = unstable_cache(
  async (kategori: EkKategori): Promise<string[]> => {
    const rows = await prisma.product.findMany({
      where: { status: "ACTIVE", isActive: true, category: { slug: kategori } },
      select: { brand: { select: { name: true } } },
      distinct: ["brandId"],
      take: 1000,
    });
    return rows.map((r) => r.brand.name).sort((a, b) => a.localeCompare(b, "tr"));
  },
  ["katalog-ek-markalar"],
  { tags: [EK_ETIKET], revalidate: 600 },
);

/** Statik katalogu olmayan kategoriler (e-scooter/e-bisiklet/karavan) için tüm markalar. */
export const getEkTum = unstable_cache(
  async (kategori: EkKategori): Promise<EkMarkaVeri[]> => {
    const rows = await prisma.product.findMany({
      where: { status: "ACTIVE", isActive: true, category: { slug: kategori } },
      select: { year: true, trimName: true, attributes: true, model: { select: { name: true } }, brand: { select: { name: true, slug: true } } },
      take: SATIR_LIMITI,
    });
    const gruplar = new Map<string, EkUrun[]>();
    for (const r of rows) {
      const k = r.brand.name;
      gruplar.set(k, [...(gruplar.get(k) ?? []), urunSatiri(r)]);
    }
    return [...gruplar.entries()].map(([marka, urunler]) => urunlerdenEk(marka, urunler)).sort((a, b) => a.marka.localeCompare(b.marka, "tr"));
  },
  ["katalog-ek-tum"],
  { tags: [EK_ETIKET], revalidate: 600 },
);

export const markaSlug = (ad: string) => slugify(ad);
