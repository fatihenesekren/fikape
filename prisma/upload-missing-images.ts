/**
 * Eksik ürün görsellerini üretici sitesinden çekip Vercel Blob'a yükler
 * ve DB'yi günceller.
 *
 * Kullanım:
 *   BLOB_READ_WRITE_TOKEN=<token> npx tsx prisma/upload-missing-images.ts
 *
 * BLOB_READ_WRITE_TOKEN: Vercel Dashboard → Storage → Blob → Token
 */
import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { put } from "@vercel/blob";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter } as any);

// ─── Kaynak URL'leri buraya yaz (agent sonuçlarından) ───────────────────────
const IMAGES: { slug: string; sourceUrl: string }[] = [
  {
    slug: "zero-sr-s-2024",
    sourceUrl: "https://images.prismic.io/zero-cms-disco/ZxInyIF3NbkBXtFK_SRS_B.png?auto=format,compress",
  },
  {
    slug: "xiaomi-mi-4-pro-2023",
    sourceUrl: "https://i02.appmifile.com/mi-com-product/fly-birds/xiaomi-scooter-4-pro/dbcffb9256e5460e64bc32a22671ed10.jpg",
  },
  {
    slug: "niu-kqi3-max-2023",
    sourceUrl: "https://shop.niu.com/cdn/shop/products/1500.jpg",
  },
  {
    slug: "segway-ninebot-max-g30-2022",
    sourceUrl: "https://segway.com/cdn/shop/products/MAX_G30LP_white_1.jpg",
  },
  // kiral-k350-2023: Web varlığı yok — /admin/araclar panelinden manuel yüklenecek
];

async function main() {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error("BLOB_READ_WRITE_TOKEN env değişkeni eksik.");
  }

  console.log(`\n${IMAGES.length} görsel yüklenecek...\n`);

  for (const { slug, sourceUrl } of IMAGES) {
    process.stdout.write(`[${slug}] İndiriliyor... `);

    const res = await fetch(sourceUrl, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; fikape-bot/1.0)" },
      signal: AbortSignal.timeout(10_000),
    });

    if (!res.ok) {
      console.error(`HATA — HTTP ${res.status}`);
      continue;
    }

    const contentType = res.headers.get("content-type") ?? "image/jpeg";
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/avif"];
    if (!allowed.some((t) => contentType.startsWith(t))) {
      console.error(`HATA — Desteklenmeyen içerik tipi: ${contentType}`);
      continue;
    }

    const ext = contentType.includes("png") ? "png"
      : contentType.includes("webp") ? "webp"
      : "jpg";

    const buffer = await res.arrayBuffer();
    process.stdout.write(`Blob'a yükleniyor... `);

    const blob = await put(`product-images/${slug}.${ext}`, buffer, {
      access: "public",
      addRandomSuffix: false,
      contentType,
    });

    await prisma.product.update({
      where: { slug },
      data: { imageUrl: blob.url },
    });

    console.log(`✓  ${blob.url}`);
  }

  console.log("\nTamamlandı.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
