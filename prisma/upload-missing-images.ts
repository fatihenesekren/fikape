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
import { createHash } from "crypto";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { put } from "@vercel/blob";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter } as any);

// Yeni ürün görseli eklemek için buraya { slug, sourceUrl } ekle ve script'i çalıştır.
const IMAGES: { slug: string; sourceUrl: string; overwrite?: boolean }[] = [
  // Thumb URL ile çalışıyor
  { slug: "togg-t10x-2023", overwrite: true, sourceUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/Togg_T10X_Grey.jpg/1280px-Togg_T10X_Grey.jpg" },
  { slug: "vw-amarok-2023",  overwrite: true, sourceUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/70/Volkswagen_Amarok_Mk2_Caflisch_Auto_Zuerich_2023_1X7A1440.jpg/1280px-Volkswagen_Amarok_Mk2_Caflisch_Auto_Zuerich_2023_1X7A1440.jpg" },
  // Hâlâ rate-limited — bir sonraki oturumda denenecek
  { slug: "togg-t10f-2024",    overwrite: true, sourceUrl: "https://commons.wikimedia.org/wiki/Special:FilePath/Togg_T10F_IAA_2025_DSC_1675.jpg" },
  { slug: "toyota-hilux-2023", overwrite: true, sourceUrl: "https://commons.wikimedia.org/wiki/Special:FilePath/Toyota_HiLux_GR_Sport_1X7A7281.jpg" },
  { slug: "yamaha-mt07-2023",  overwrite: true, sourceUrl: "https://commons.wikimedia.org/wiki/Special:FilePath/2021_Black_Yamaha_MT-07.jpg" },
];

function resolveWikimediaUrl(sourceUrl: string): string {
  // Special:FilePath → upload.wikimedia.org/wikipedia/commons/X/XY/Filename
  // MD5(filename) hash ile doğrudan CDN URL hesaplanır — API çağrısı yok
  const match = sourceUrl.match(/Special:FilePath\/(.+)$/);
  if (!match) return sourceUrl;
  const filename = decodeURIComponent(match[1]).replace(/ /g, "_");
  const hash = createHash("md5").update(filename).digest("hex");
  const a = hash[0];
  const ab = hash.slice(0, 2);
  return `https://upload.wikimedia.org/wikipedia/commons/${a}/${ab}/${encodeURIComponent(filename)}`;
}

async function main() {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error("BLOB_READ_WRITE_TOKEN env değişkeni eksik.");
  }

  console.log(`\n${IMAGES.length} görsel yüklenecek...\n`);

  for (const { slug, sourceUrl, overwrite } of IMAGES) {
    await new Promise((r) => setTimeout(r, 3000));
    process.stdout.write(`[${slug}] İndiriliyor... `);

    // Wikimedia Special:FilePath → doğrudan CDN URL (MD5 hash, API yok)
    const resolvedUrl = sourceUrl.includes("Special:FilePath")
      ? resolveWikimediaUrl(sourceUrl)
      : sourceUrl;

    const res = await fetch(resolvedUrl, {
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
