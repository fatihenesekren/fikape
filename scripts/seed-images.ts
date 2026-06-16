/**
 * Tüm imageUrl=null olan ürünler için Wikipedia'dan fotoğraf çekip DB'ye yazar.
 * Çalıştır: npx tsx scripts/seed-images.ts
 */

import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { getVehicleImageUrl } from "../src/lib/vehicleImages";
import "dotenv/config";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
} as any) as PrismaClient;

async function main() {
  const products = await prisma.product.findMany({
    where: { imageUrl: null },
    select: { id: true, slug: true, name: true },
  });

  if (products.length === 0) {
    console.log("✓ Tüm ürünlerin imageUrl'si zaten dolu.");
    return;
  }

  console.log(`${products.length} ürün için fotoğraf aranıyor...\n`);

  let updated = 0;
  let skipped = 0;

  for (const product of products) {
    const url = await getVehicleImageUrl(product.slug);

    if (url) {
      await prisma.product.update({
        where: { id: product.id },
        data: { imageUrl: url },
      });
      console.log(`✓  ${product.name.padEnd(35)} ${url.slice(0, 60)}...`);
      updated++;
    } else {
      console.log(`–  ${product.name.padEnd(35)} (Wikipedia eşleşmesi yok)`);
      skipped++;
    }
  }

  console.log(`\nTamamlandı: ${updated} güncellendi, ${skipped} atlandı.`);

  if (skipped > 0) {
    console.log(
      "\nİpucu: Eşleşmeyen araçlar için src/lib/vehicleImages.ts dosyasına\n" +
      "WIKI_PAGE kaydı ekleyin ve scripti tekrar çalıştırın."
    );
  }
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
