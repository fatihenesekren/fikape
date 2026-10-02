import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { BASE_URL } from "@/lib/baseUrl";

// Her istekte DB sorgusu yerine saatlik önbellek; statik sayfalarda "şimdi" damgası verilmez (lastmod güvenilirliği).
export const revalidate = 3600;

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

  const ARACLAR_CATEGORIES = ["otomobil", "motosiklet", "e-scooter", "e-bisiklet", "karavan", "kamyonet"];

  return [
    { url: BASE_URL, changeFrequency: "daily", priority: 1 },
    // /takas siteden hiçbir sayfaya link almadığı için Google için "yetim
    // sayfa" durumundaydı (bkz. denetim raporu) — sitemap'e eklenmesi kullanıcı
    // arayüzünü etkilemiyor, sadece Google'ın sayfayı bulmasını sağlıyor.
    { url: `${BASE_URL}/takas`, changeFrequency: "daily", priority: 0.6 },
    // Footer'daki statik bilgi/hukuk sayfaları — hiçbiri sitemap'te değildi
    // (bkz. footer denetim raporu, 2026-09-22).
    { url: `${BASE_URL}/nasil-calisir`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE_URL}/karsilastir`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE_URL}/plus`, changeFrequency: "weekly", priority: 0.4 },
    { url: `${BASE_URL}/gelistiriciler`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE_URL}/gizlilik`, changeFrequency: "monthly", priority: 0.3 },
    { url: `${BASE_URL}/kullanim-kosullari`, changeFrequency: "monthly", priority: 0.3 },
    { url: `${BASE_URL}/usta-ol`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${BASE_URL}/uyelik-sozlesmesi`, changeFrequency: "monthly", priority: 0.3 },
    // /araclar katalog sayfası + kategori varyantları (filtreli URL'ler noindex).
    { url: `${BASE_URL}/araclar`, changeFrequency: "daily", priority: 0.7 },
    ...ARACLAR_CATEGORIES.map((slug) => ({
      url: `${BASE_URL}/araclar?kategori=${slug}`,
      changeFrequency: "daily" as const,
      priority: 0.6,
    })),
    ...products.map((p) => ({
      url: `${BASE_URL}/araclar/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...brands.map((b) => ({
      url: `${BASE_URL}/markalar/${b.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.5,
    })),
  ];
}
