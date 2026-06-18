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

// Yeni ürün görseli eklemek için buraya { slug, sourceUrl } ekle ve script'i çalıştır.
const IMAGES: { slug: string; sourceUrl: string; overwrite?: boolean }[] = [
  // Beyaz arkaplan ürün fotoğrafları — MediaMarkt/üretici resmi görselleri
  {
    // MediaMarkt TR — beyaz arkaplan, PNG (önceki koyu stüdyo fotoğrafı değiştirildi)
    slug: "xiaomi-mi-4-pro-2023",
    sourceUrl: "https://assets.mmsrg.com/isr/166325/c1/-/ASSET_MMS_93905010/fee_786_587_png",
    overwrite: true,
  },
];

async function main() {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error("BLOB_READ_WRITE_TOKEN env değişkeni eksik.");
  }

  console.log(`\n${IMAGES.length} görsel yüklenecek...\n`);

  for (const { slug, sourceUrl, overwrite } of IMAGES) {
    process.stdout.write(`[${slug}] İndiriliyor... `);

    const res = await fetch(sourceUrl, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; fikape-bot/1.0)" },
      signal: AbortSignal.timeout(10_000),
    });

    if (!res.ok) {
      console.error(`HATA — HTTP ${res.status}`);
      continue;
    }

    let contentType = res.headers.get("content-type") ?? "image/jpeg";
    // Bazı sunucular application/octet-stream döndürür — URL'den uzantıyı çıkar
    if (contentType.startsWith("application/octet-stream") || contentType.startsWith("text/")) {
      const urlPath = new URL(sourceUrl).pathname.toLowerCase();
      if (urlPath.endsWith(".png")) contentType = "image/png";
      else if (urlPath.endsWith(".webp")) contentType = "image/webp";
      else contentType = "image/jpeg";
    }
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
      ...(overwrite ? { allowOverwrite: true } : {}),
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
