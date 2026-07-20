import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { calcTrustScore } from "../src/lib/trustScore";

// Tek seferlik backfill: trustScore alanı öncesinde tüm review'lar sabit 35
// idi (bkz. commit 2413837). PUBLISHED review'ları güncel TrustLevel+Garaj
// sinyaliyle yeniden hesaplayıp ScoreSnapshot'a "EDITED" nedeniyle kayıt
// düşer (ayrı bir BACKFILL enum değeri henüz yok, en yakın anlamı EDITED
// taşıyor) — böylece ağırlıklı ortalamaya geçilmeden önce gerçek bir
// trustScore dağılımı oluşur.
async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  const prisma = new PrismaClient({ adapter });

  const reviews = await prisma.review.findMany({
    where: { status: "PUBLISHED" },
    select: {
      id: true,
      userId: true,
      productId: true,
      trustScore: true,
      scoreOverall: true,
      user: { select: { trustLevel: true } },
    },
  });

  const userIds = [...new Set(reviews.map((r) => r.userId))];
  const garajEntries = await prisma.userProduct.findMany({
    where: { userId: { in: userIds } },
    select: { userId: true, productId: true },
  });
  const garajSet = new Set(garajEntries.map((g) => `${g.userId}:${g.productId}`));

  let updated = 0;
  for (const r of reviews) {
    const garajLinked = garajSet.has(`${r.userId}:${r.productId}`);
    const trustScore = calcTrustScore({ trustLevel: r.user.trustLevel, garajLinked });
    if (trustScore === r.trustScore) continue;

    await prisma.$transaction([
      prisma.review.update({ where: { id: r.id }, data: { trustScore } }),
      prisma.scoreSnapshot.create({
        data: {
          reviewId: r.id,
          productId: r.productId,
          trustScore,
          scoreOverall: r.scoreOverall,
          status: "PUBLISHED",
          reason: "EDITED",
        },
      }),
    ]);
    updated++;
  }

  console.log(`OK: ${updated}/${reviews.length} review güncellendi`);
  await prisma.$disconnect();
}
main().catch(console.error);
