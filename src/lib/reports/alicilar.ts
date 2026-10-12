import { prisma } from "@/lib/prisma";

/** REPORT_RECIPIENTS env verilmişse ona, yoksa trustLevel>=5 kullanıcılara. */
export async function resolveRecipients(): Promise<string[]> {
  const override = process.env.REPORT_RECIPIENTS?.trim();
  if (override) {
    return override.split(",").map((s) => s.trim()).filter((s) => s.includes("@"));
  }
  const admins = await prisma.user.findMany({
    where: { trustLevel: { gte: 5 }, isBanned: false },
    select: { email: true },
  });
  return admins.map((a) => a.email).filter(Boolean);
}
