import { getClientIp } from "@/lib/security";

// Bellek içi, tek-instance rate limiter. Vercel serverless'ta cold start'ta sıfırlanır
// ve instance'lar arası paylaşılmaz — ama düşük trafikli bu aşamada bot/scraping
// gürültüsünü ucuza kesmek için yeterli. Ölçek büyüdükçe Upstash Redis'e taşınabilir.
const buckets = new Map<string, { count: number; resetAt: number }>();

function sweepExpired(now: number) {
  if (buckets.size < 5000) return;
  for (const [key, bucket] of buckets) {
    if (now > bucket.resetAt) buckets.delete(key);
  }
}

export function checkRateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  sweepExpired(now);

  const bucket = buckets.get(key);
  if (!bucket || now > bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (bucket.count >= limit) return false;

  bucket.count++;
  return true;
}

export function rateLimitByIp(req: Request, prefix: string, limit: number, windowMs: number): boolean {
  const ip = getClientIp(req) ?? "unknown";
  return checkRateLimit(`${prefix}:${ip}`, limit, windowMs);
}
