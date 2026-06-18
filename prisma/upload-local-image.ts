import "dotenv/config";
import { readFileSync } from "fs";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { put } from "@vercel/blob";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter } as any);

async function main() {
  const slug = "xiaomi-mi-4-pro-2023";
  const localPath = "C:/Users/dell/AppData/Local/Temp/xiaomi-white.png";

  const buffer = readFileSync(localPath);
  process.stdout.write(`[${slug}] Blob'a yükleniyor... `);

  const blob = await put(`product-images/${slug}.png`, buffer, {
    access: "public",
    addRandomSuffix: false,
    contentType: "image/png",
    allowOverwrite: true,
  });

  await prisma.product.update({
    where: { slug },
    data: { imageUrl: blob.url },
  });

  console.log(`✓  ${blob.url}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
