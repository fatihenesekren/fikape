import { timingSafeEqual } from "crypto";

/**
 * Vercel Cron Authorization başlığını doğrular. CRON_SECRET tanımsız/boşsa HER ZAMAN reddeder
 * ("Bearer undefined" ile kapı açılmasın) ve karşılaştırma sabit zamanlıdır.
 */
export function cronYetkili(authHeader: string | null): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret || !authHeader) return false;
  const beklenen = Buffer.from(`Bearer ${secret}`, "utf8");
  const gelen = Buffer.from(authHeader, "utf8");
  return gelen.length === beklenen.length && timingSafeEqual(gelen, beklenen);
}
