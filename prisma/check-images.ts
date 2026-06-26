import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter } as any);

async function main() {
  const products = await prisma.product.findMany({
    where: { imageUrl: { not: null } },
    select: { slug: true, imageUrl: true },
    orderBy: { slug: "asc" },
  });

  const blob     = products.filter((p) => p.imageUrl?.includes("blob.vercel-storage.com"));
  const external = products.filter((p) => !p.imageUrl?.includes("blob.vercel-storage.com"));

  console.log(`Vercel Blob : ${blob.length} ürün — OK`);
  console.log(`Harici URL  : ${external.length} ürün`);

  if (external.length === 0) {
    console.log("  Tüm görseller Vercel Blob'da. Temiz!");
  } else {
    console.log("");
    for (const p of external) {
      const domain = new URL(p.imageUrl!).hostname;
      console.log(`  !! ${p.slug}`);
      console.log(`     ${domain}`);
      console.log(`     ${p.imageUrl}`);
    }
  }
}

main()
  .catch(console.error)
  .finally(() => (prisma as any).$disconnect());
