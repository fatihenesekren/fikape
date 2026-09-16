/**
 * Mevcut ACTIVE ürünlerden henüz AiVehicleSummary kaydı olmayanlar için
 * geriye dönük AI özeti üretir (admin onayı bekleyen kuyruğa düşer).
 * Gemini ücretsiz katman rate limit'ine takılmamak için istekler arasında
 * bekleme var — tek seferde toplu değil.
 * Çalıştır: npx tsx scripts/backfill-ai-summaries.ts
 */

import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

const DELAY_MS = 6000;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const { syncAiVehicleSummary } = await import("../src/lib/ai/vehicleSummary");

  const products = await prisma.product.findMany({
    where: { status: "ACTIVE", aiSummary: null },
    select: { id: true, name: true },
    orderBy: { id: "asc" },
  });

  if (products.length === 0) {
    console.log("✓ Tüm aktif ürünlerin zaten bir AI özeti var.");
    return;
  }

  console.log(`${products.length} ürün için AI özeti üretilecek (~${Math.round(products.length * DELAY_MS / 1000)} sn sürer)...\n`);

  let done = 0;
  let failed = 0;
  for (const product of products) {
    try {
      await syncAiVehicleSummary(product.id);
      // syncAiVehicleSummary üretim hatalarını (rate-limit, boş yanıt vb.)
      // sessizce yutar (normal akışta doğru davranış — istek zamanı tekrar
      // denenmiş olur) — bu yüzden burada gerçekten satır oluştu mu diye
      // ayrıca doğruluyoruz, aksi halde başarısız denemeler "✓" görünür.
      const created = await prisma.aiVehicleSummary.findUnique({ where: { productId: product.id } });
      if (created) {
        done++;
        console.log(`✓  ${product.name}`);
      } else {
        failed++;
        console.log(`✗  ${product.name} — üretim başarısız (log'a bakın), tekrar denenecek`);
      }
    } catch (e) {
      failed++;
      console.error(`✗  ${product.name}:`, e);
    }
    await sleep(DELAY_MS);
  }

  console.log(`\nBitti. ${done} başarılı, ${failed} başarısız.`);
  console.log("Üretilenler /admin/ai-ozetleri sayfasında onay bekliyor.");
}

main()
  .catch((e) => { console.error(e); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
