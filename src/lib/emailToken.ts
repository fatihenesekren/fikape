import { createHmac } from "crypto";

const SECRET = process.env.AUTH_SECRET!;

export function createVerificationToken(userId: number): string {
  const expiry = Date.now() + 24 * 60 * 60 * 1000; // 24 saat
  const payload = `${userId}:${expiry}`;
  const sig = createHmac("sha256", SECRET).update(payload).digest("hex");
  return Buffer.from(`${payload}:${sig}`).toString("base64url");
}

export function verifyEmailToken(token: string): { userId: number } | null {
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf8");
    const [userIdStr, expiryStr, sig] = decoded.split(":");
    const payload = `${userIdStr}:${expiryStr}`;
    const expected = createHmac("sha256", SECRET).update(payload).digest("hex");
    if (sig !== expected) return null;
    if (Date.now() > Number(expiryStr)) return null;
    return { userId: Number(userIdStr) };
  } catch {
    return null;
  }
}

// Şifre sıfırlama token'ı: mevcut passwordHash'in imzaya dahil edilmesiyle
// tek kullanımlıktır — şifre değişince eski token'lar otomatik geçersiz olur,
// ayrı bir DB alanı (resetToken/expiry) veya migration gerekmez.
export function createPasswordResetToken(userId: number, currentPasswordHash: string): string {
  const expiry = Date.now() + 24 * 60 * 60 * 1000; // 24 saat
  const hashFingerprint = createHmac("sha256", SECRET).update(currentPasswordHash).digest("hex").slice(0, 16);
  const payload = `${userId}:${expiry}:${hashFingerprint}`;
  const sig = createHmac("sha256", SECRET).update(payload).digest("hex");
  return Buffer.from(`${payload}:${sig}`).toString("base64url");
}

export function verifyPasswordResetToken(token: string, currentPasswordHash: string): { userId: number } | null {
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf8");
    const [userIdStr, expiryStr, hashFingerprint, sig] = decoded.split(":");
    const payload = `${userIdStr}:${expiryStr}:${hashFingerprint}`;
    const expected = createHmac("sha256", SECRET).update(payload).digest("hex");
    if (sig !== expected) return null;
    if (Date.now() > Number(expiryStr)) return null;
    const expectedFingerprint = createHmac("sha256", SECRET).update(currentPasswordHash).digest("hex").slice(0, 16);
    if (hashFingerprint !== expectedFingerprint) return null; // şifre zaten değişmiş
    return { userId: Number(userIdStr) };
  } catch {
    return null;
  }
}
