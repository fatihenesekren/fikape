import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { BASE_URL } from "@/lib/baseUrl";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, brands] = await Promise.all([
    prisma.product.findMany({
      where: { isActive: true },
      select: { slug: true, updatedAt: true },
    }),
    prisma.brand.findMany({
      where: { isActive: true },
      select: { slug: true },
    }),
  ]);

  return [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    // /takas siteden hiçbir sayfaya link almadığı için Google için "yetim
    // sayfa" durumundaydı (bkz. denetim raporu) — sitemap'e eklenmesi kullanıcı
    // arayüzünü etkilemiyor, sadece Google'ın sayfayı bulmasını sağlıyor.
    { url: `${BASE_URL}/takas`, lastModified: new Date(), changeFrequency: "daily", priority: 0.6 },
    ...products.map((p) => ({
      url: `${BASE_URL}/araclar/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...brands.map((b) => ({
      url: `${BASE_URL}/markalar/${b.slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.5,
    })),
  ];
}
