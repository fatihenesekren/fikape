import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  const prisma = new PrismaClient({ adapter } as any);

  // 1. Model adını güncelle
  await prisma.model.update({
    where: { slug: "knaus-sport-400" },
    data: { slug: "knaus-beaufort", name: "Beaufort" },
  });
  console.log("✓ Model: knaus-sport-400 → knaus-beaufort (Beaufort)");

  // 2. Ürünü güncelle — slug, name, attributes
  await prisma.product.update({
    where: { slug: "knaus-sport-400-lk-2023" },
    data: {
      slug: "knaus-beaufort-2023",
      name: "Knaus Beaufort 2023",
      trimName: null,
      attributes: {
        karavan_type:    "motorlu",
        berth:           4,
        length_cm:       799,
        width_cm:        232,
        total_weight_kg: 4250,
        has_bathroom:    true,
        has_kitchen:     true,
        has_ac:          true,
      },
    },
  });
  console.log("✓ Ürün: knaus-sport-400-lk-2023 → knaus-beaufort-2023 (motorlu)");

  await prisma.$disconnect();
}
main().catch(console.error);
