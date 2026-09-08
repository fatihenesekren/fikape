import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slugify";

export interface ExistingVehicleMatch {
  slug: string;
  name: string;
  year: number | null;
  trimName: string | null;
  transmission: string | null;
  reviewCount: number;
}

// Katalogda (ACTIVE Product) bu marka+model zaten var mı?
//
// Eşleşme anahtarı: model.slug === slugify(`${brand}-${model}`). Hem seed hem
// öner akışı modeli aynı şekilde slug'lıyor (nesil aralığı dahil TAM ad, örn.
// "Renault-Clio 4 (2012-2019)"), o yüzden bu güvenilir bir anahtar. Yıl ve
// donanıma bakılmaz — "bu nesil araç fikape'de mevcut mu?" sorusu bunlardan
// bağımsız; farklı yıl/donanım yeni bir Product'a değil, mevcut araca yorum
// yazma sebebidir.
//
// Not: eski birebir-slug kontrolü (slugify(marka-model-donanım-yıl)) çoğu zaman
// tutmuyordu (kullanıcı farklı yıl/donanım seçince) ve sessizce PENDING kopya
// üretiliyordu — bu fonksiyon onun yerini alıyor.
export async function findExistingVehicles(
  brandName: string,
  modelName: string,
  categorySlug?: string,
): Promise<ExistingVehicleMatch[]> {
  const b = brandName?.trim();
  const m = modelName?.trim();
  if (!b || !m) return [];

  const modelSlug = slugify(`${b}-${m}`);
  if (!modelSlug) return [];

  const products = await prisma.product.findMany({
    where: {
      status: "ACTIVE",
      model: { slug: modelSlug },
      ...(categorySlug ? { category: { slug: categorySlug } } : {}),
    },
    select: {
      slug: true,
      name: true,
      year: true,
      trimName: true,
      attributes: true,
      _count: { select: { reviews: { where: { status: "PUBLISHED" } } } },
    },
  });

  return products
    .map((p) => ({
      slug: p.slug,
      name: p.name,
      year: p.year,
      trimName: p.trimName,
      transmission:
        ((p.attributes as Record<string, unknown> | null)?.transmission as string | undefined) ?? null,
      reviewCount: p._count.reviews,
    }))
    .sort(
      (x, y) => y.reviewCount - x.reviewCount || (y.year ?? 0) - (x.year ?? 0),
    );
}
