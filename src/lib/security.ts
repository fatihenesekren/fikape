import { createCipheriv, createDecipheriv, createHmac, randomBytes, scryptSync } from "crypto";
import { prisma } from "@/lib/prisma";
import type { ReviewStatus } from "@/generated/prisma/client";

const SECRET = process.env.AUTH_SECRET!;

function hash(value: string): string {
  return createHmac("sha256", SECRET).update(value).digest("hex");
}

// 5651 m.5 trafik bilgisi yükümlülüğü, yetkili merci talebinde IP'nin ÇÖZÜLEBİLİR
// olmasını gerektirir — hash() (yukarıda) tek yönlü olduğu için bu amaca uymaz.
// AES-256-GCM ile şifreliyoruz: anahtar DB'nin dışında (env) tutulduğu için tek
// başına DB sızıntısında IP'ler okunamaz, ama yasal talep halinde AUTH_SECRET'e
// sahip olan taraf (biz) çözüp ibraz edebilir. Kullanım: lib/accessLog.ts.
// Eski kayıtlar (öneksiz) AUTH_SECRET türevi anahtarla şifrelidir. IP_LOG_KEY tanımlanırsa YENİ kayıtlar o anahtarla
// ("v2:" önekli) şifrelenir; böylece AUTH_SECRET döndürüldüğünde yeni kayıtlar etkilenmez. Eski kayıtların çözülebilmesi
// için eski AUTH_SECRET saklanmalıdır. Env tanımlı değilse davranış eskisiyle birebir aynıdır.
const IP_ENCRYPTION_KEY = scryptSync(SECRET, "fikape-access-log-ip", 32);
const IP_LOG_KEY_V2 = process.env.IP_LOG_KEY ? scryptSync(process.env.IP_LOG_KEY, "fikape-access-log-ip-v2", 32) : null;

const V2_ONEK = "v2:";

export function encryptIp(ip: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", IP_LOG_KEY_V2 ?? IP_ENCRYPTION_KEY, iv);
  const encrypted = Buffer.concat([cipher.update(ip, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  const veri = Buffer.concat([iv, tag, encrypted]).toString("base64");
  return IP_LOG_KEY_V2 ? V2_ONEK + veri : veri;
}

export function decryptIp(payload: string): string {
  const v2 = payload.startsWith(V2_ONEK);
  if (v2 && !IP_LOG_KEY_V2) throw new Error("IP_LOG_KEY tanımlı değil: v2 kayıt çözülemez");
  const buf = Buffer.from(v2 ? payload.slice(V2_ONEK.length) : payload, "base64");
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const encrypted = buf.subarray(28);
  const decipher = createDecipheriv("aes-256-gcm", v2 ? IP_LOG_KEY_V2! : IP_ENCRYPTION_KEY, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
}

export function getClientIp(req: Request): string | null {
  // Vercel kendi başlığını istemciden gelen değerle ezmez/yazar: önce o, sonra x-real-ip; X-Forwarded-For'un ilk değeri
  // başka barındırmada istemci tarafından sahtelenebilir, en sona bırakıldı.
  const vercel = req.headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim();
  if (vercel) return vercel;
  const real = req.headers.get("x-real-ip")?.trim();
  if (real) return real;
  const forwardedFor = req.headers.get("x-forwarded-for");
  return forwardedFor?.split(",")[0]?.trim() || null;
}

// KVKK: ham IP/UA hiçbir yerde tutulmaz, sadece hash'i.
export function hashRequestContext(req: Request): { ipHash: string | null; userAgentHash: string | null } {
  const ip = getClientIp(req);
  const userAgent = req.headers.get("user-agent");

  return {
    ipHash: ip ? hash(ip) : null,
    userAgentHash: userAgent ? hash(userAgent) : null,
  };
}

export function recordScoreSnapshot(params: {
  reviewId: number;
  productId: number;
  trustScore: number;
  scoreOverall: number;
  status: ReviewStatus;
  reason: "CREATED" | "PUBLISHED" | "REJECTED" | "EDITED";
}) {
  return prisma.scoreSnapshot.create({ data: params });
}

export function recordModerationLog(params: {
  reviewId: number;
  moderatorId: number;
  action: "APPROVED" | "REJECTED";
  reason?: string | null;
}) {
  return prisma.moderationLog.create({ data: params });
}
