import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { kurasyonYap, type VitrinAday } from "./kurasyon";
import type { FikapeScores } from "@/lib/fikape";

export interface VitrinKart {
  id: number;
  slug: string;
  trimName: string | null;
  year: number | null;
  attributes: Record<string, unknown>;
  imageUrl: string | null;
  brand: { name: string };
  model: { name: string };
  category: { slug: string } | null;
  scores: FikapeScores | null;
  yorumSayisi: number;
}

const GUN28 = 28 * 24 * 60 * 60 * 1000;

export async function vitrinHesapla(): Promise<VitrinKart[]> {
  const urunler = await prisma.product.findMany({
    where: { isActive: true, status: "ACTIVE", imageUrl: { not: null }, aiSummary: { is: { status: "APPROVED" } } },
    select: {
      id: true, slug: true, trimName: true, year: true, attributes: true, imageUrl: true, imageCredit: true, modelId: true, weeklyViewCount: true,
      brand: { select: { name: true } }, model: { select: { name: true } }, category: { select: { slug: true } },
    },
  });
  if (!urunler.length) return [];
  const idler = urunler.map((u) => u.id);

  const [yorumlar, anlik] = await Promise.all([
    prisma.review.groupBy({
      by: ["productId"], where: { status: "PUBLISHED", productId: { in: idler } },
      _avg: { scoreFiyat: true, scoreKalite: true, scorePerformans: true, scoreOverall: true }, _count: { id: true },
    }),
    prisma.weeklyViewSnapshot.groupBy({
      by: ["productId"], where: { productId: { in: idler }, weekStart: { gte: new Date(Date.now() - GUN28) } }, _sum: { weeklyViews: true },
    }),
  ]);
  const yorumMap = new Map(yorumlar.map((y) => [y.productId, y]));
  const anlikMap = new Map(anlik.map((s) => [s.productId, s._sum.weeklyViews ?? 0]));
  const ortalamalar = yorumlar.map((y) => y._avg.scoreOverall ?? 0).filter((x) => x > 0);
  const globalOrtalama = ortalamalar.length ? ortalamalar.reduce((a, b) => a + b, 0) / ortalamalar.length : 0;

  const adaylar: VitrinAday[] = urunler.map((u) => {
    const y = yorumMap.get(u.id);
    return {
      id: u.id, modelId: u.modelId, categorySlug: u.category?.slug ?? "?",
      attributes: (u.attributes ?? {}) as Record<string, unknown>, year: u.year, yayinda: true, imageUrl: u.imageUrl,
      atifVar: u.imageCredit != null, aiOzetOnayli: true,
      yorumSayisi: y?._count.id ?? 0, yorumOrtalamasi: y?._avg.scoreOverall ?? 0,
      goruntulenme: (anlikMap.get(u.id) ?? 0) + (u.weeklyViewCount ?? 0),
    };
  });

  const sirali = kurasyonYap(adaylar, { globalOrtalama });
  const byId = new Map(urunler.map((u) => [u.id, u]));
  return sirali.map(({ id }) => {
    const u = byId.get(id)!;
    const y = yorumMap.get(id);
    return {
      id: u.id, slug: u.slug, trimName: u.trimName, year: u.year, attributes: (u.attributes ?? {}) as Record<string, unknown>,
      imageUrl: u.imageUrl, brand: u.brand, model: u.model, category: u.category,
      scores: y
        ? { scoreFiyat: y._avg.scoreFiyat ?? 0, scoreKalite: y._avg.scoreKalite ?? 0, scorePerformans: y._avg.scorePerformans ?? 0, scoreOverall: y._avg.scoreOverall ?? 0 }
        : null,
      yorumSayisi: y?._count.id ?? 0,
    };
  });
}

/** Ana sayfa vitrini — kişiye özel veri içermez (favori durumu ayrı sorgulanır); 10 dk önbellek. */
export const getVitrin = unstable_cache(vitrinHesapla, ["vitrin-v1"], { revalidate: 600, tags: ["vitrin"] });
