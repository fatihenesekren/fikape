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

// Header'larda (X-RateLimit-*, Retry-After) gerçek değer göstermek isteyen
// çağıranlar (örn. public Skor API) için — allowed/remaining/resetAt üçlüsü.
export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  /** Pencerenin sıfırlanacağı an (epoch ms). */
  resetAt: number;
}

function checkRateLimitMemoryDetailed(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  sweepExpired(now);

  const bucket = buckets.get(key);
  if (!bucket || now > bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, resetAt: now + windowMs };
  }
  if (bucket.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: bucket.resetAt };
  }
  bucket.count++;
  return { allowed: true, remaining: limit - bucket.count, resetAt: bucket.resetAt };
}

async function checkRateLimitRedisDetailed(key: string, limit: number, windowMs: number): Promise<RateLimitResult> {
  const redisKey = `ratelimit:${key}`;
  const count = await redis!.incr(redisKey);
  let resetAt: number;
  if (count === 1) {
    // Sadece ilk istekte TTL koyuluyor — sayaç zaten varsa pencere sıfırlanmasın diye.
    await redis!.pexpire(redisKey, windowMs);
    resetAt = Date.now() + windowMs;
  } else {
    const ttl = await redis!.pttl(redisKey);
    resetAt = Date.now() + (ttl > 0 ? ttl : windowMs);
  }
  return { allowed: count <= limit, remaining: Math.max(0, limit - count), resetAt };
}

export async function checkRateLimitDetailed(key: string, limit: number, windowMs: number): Promise<RateLimitResult> {
  if (redis) {
    try {
      return await checkRateLimitRedisDetailed(key, limit, windowMs);
    } catch (e) {
      // Redis geçici olarak erişilemezse rate limit'i TAMAMEN devre dışı bırakmak
      // yerine (ki bu kötüye kullanıma açık kapı bırakır) bellek-içi limitleyiciye
      // düşülüyor — tek-instance olsa da hiç limit olmamasından daha güvenli.
      console.error("[rateLimit] Redis hatası, bellek-içi limitleyiciye düşüldü:", e);
    }
  }
  return checkRateLimitMemoryDetailed(key, limit, windowMs);
}

export async function checkRateLimit(key: string, limit: number, windowMs: number): Promise<boolean> {
  return (await checkRateLimitDetailed(key, limit, windowMs)).allowed;
}

export async function rateLimitByIp(req: Request, prefix: string, limit: number, windowMs: number): Promise<boolean> {
  const ip = getClientIp(req) ?? "unknown";
  return checkRateLimit(`${prefix}:${ip}`, limit, windowMs);
}

export async function rateLimitByIpDetailed(req: Request, prefix: string, limit: number, windowMs: number): Promise<RateLimitResult> {
  const ip = getClientIp(req) ?? "unknown";
  return checkRateLimitDetailed(`${prefix}:${ip}`, limit, windowMs);
}

export async function rateLimitByEmail(email: string, prefix: string, limit: number, windowMs: number): Promise<boolean> {
  return checkRateLimit(`${prefix}:${email.toLowerCase()}`, limit, windowMs);
}
