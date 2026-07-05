import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

/**
 * Kürasyonlu "kurucu yorumcu" programı — her ürün için ilk 3 yayınlanmış
 * yorum, yazarına o yorumda "Kurucu Yorumcu" rozeti kazandırır.
 * Prisma per-grup top-N destekmediği için ROW_NUMBER() window function kullanılır.
 */
export async function getFoundingReviewIds(productIds: number[]): Promise<Set<number>> {
  if (productIds.length === 0) return new Set();

  const rows = await prisma.$queryRaw<{ id: number }[]>`
    SELECT id FROM (
      SELECT id, ROW_NUMBER() OVER (PARTITION BY "productId" ORDER BY "createdAt" ASC) AS rn
      FROM "reviews"
      WHERE status = 'PUBLISHED' AND "productId" IN (${Prisma.join(productIds)})
    ) ranked
    WHERE rn <= 3
  `;

  return new Set(rows.map((r) => r.id));
}
