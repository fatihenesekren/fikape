import { Redis } from "@upstash/redis";
import { getClientIp } from "@/lib/security";

// Kalıcı store (Upstash Redis, serverless-uyumlu REST client) — env değişkenleri
// tanımlıysa kullanılır. Tanımlı değilse (bu projede şu an durum bu) davranış
// öncekiyle birebir aynı: bellek-içi, tek-instance limitleyici. Redis'e geçiş
// UYGULAMA KODU tarafında hazır; canlıya almak için sadece Upstash hesabı açıp
// UPSTASH_REDIS_REST_URL/UPSTASH_REDIS_REST_TOKEN env değişkenlerini eklemek yeterli
// (bkz. denetim raporu — "rate limiter bellek-içi/tek-instance, instance'lar arası
// paylaşılmıyor" maddesi).
const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({ url: process.env.UPSTASH_REDIS_REST_URL, token: process.env.UPSTASH_REDIS_REST_TOKEN })
    : null;

const buckets = new Map<string, { count: number; resetAt: number }>();

function sweepExpired(now: number) {
  if (buckets.size < 5000) return;
  for (const [key, bucket] of buckets) {
    if (now > bucket.resetAt) buckets.delete(key);
  }
}

function checkRateLimitMemory(key: string, limit: number, windowMs: number): boolean {
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

async function checkRateLimitRedis(key: string, limit: number, windowMs: number): Promise<boolean> {
  const redisKey = `ratelimit:${key}`;
  const count = await redis!.incr(redisKey);
  if (count === 1) {
    // Sadece ilk istekte TTL koyuluyor — sayaç zaten varsa pencere sıfırlanmasın diye.
    await redis!.pexpire(redisKey, windowMs);
  }
  return count <= limit;
}

export async function checkRateLimit(key: string, limit: number, windowMs: number): Promise<boolean> {
  if (redis) {
    try {
      return await checkRateLimitRedis(key, limit, windowMs);
    } catch (e) {
      // Redis geçici olarak erişilemezse rate limit'i TAMAMEN devre dışı bırakmak
      // yerine (ki bu kötüye kullanıma açık kapı bırakır) bellek-içi limitleyiciye
      // düşülüyor — tek-instance olsa da hiç limit olmamasından daha güvenli.
      console.error("[rateLimit] Redis hatası, bellek-içi limitleyiciye düşüldü:", e);
    }
  }
  return checkRateLimitMemory(key, limit, windowMs);
}

export async function rateLimitByIp(req: Request, prefix: string, limit: number, windowMs: number): Promise<boolean> {
  const ip = getClientIp(req) ?? "unknown";
  return checkRateLimit(`${prefix}:${ip}`, limit, windowMs);
}

export async function rateLimitByEmail(email: string, prefix: string, limit: number, windowMs: number): Promise<boolean> {
  return checkRateLimit(`${prefix}:${email.toLowerCase()}`, limit, windowMs);
}
