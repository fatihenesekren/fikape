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
const IP_ENCRYPTION_KEY = scryptSync(SECRET, "fikape-access-log-ip", 32);

export function encryptIp(ip: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", IP_ENCRYPTION_KEY, iv);
  const encrypted = Buffer.concat([cipher.update(ip, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString("base64");
}

export function decryptIp(payload: string): string {
  const buf = Buffer.from(payload, "base64");
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const encrypted = buf.subarray(28);
  const decipher = createDecipheriv("aes-256-gcm", IP_ENCRYPTION_KEY, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
}

export function getClientIp(req: Request): string | null {
  const forwardedFor = req.headers.get("x-forwarded-for");
  return forwardedFor?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || null;
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
