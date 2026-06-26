import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  const prisma = new PrismaClient({ adapter } as any);
  const r = await prisma.category.update({ where: { slug: "e-scooter" }, data: { name: "E-Scooter" } });
  console.log("OK:", r.name);
  await prisma.$disconnect();
}
main().catch(console.error);
