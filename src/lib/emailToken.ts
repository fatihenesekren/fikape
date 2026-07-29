import { createHmac, timingSafeEqual } from "crypto";

const SECRET = process.env.AUTH_SECRET!;

// Token içindeki imza kullanıcıdan geliyor (base64url decode + split) — uzunluğu
// garanti değil, bozuk/kısaltılmış bir token gönderilirse timingSafeEqual eşit
// olmayan buffer'larda exception fırlatır. Önce uzunluk kontrolü yapılıyor.
function safeEqual(a: string | undefined, b: string): boolean {
  if (!a) return false;
  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

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
    if (!userIdStr || !expiryStr || !sig) return null;
    const payload = `${userIdStr}:${expiryStr}`;
    const expected = createHmac("sha256", SECRET).update(payload).digest("hex");
    if (!safeEqual(sig, expected)) return null;
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
  const expiry = Date.now() + 60 * 60 * 1000; // 1 saat
  const hashFingerprint = createHmac("sha256", SECRET).update(currentPasswordHash).digest("hex").slice(0, 16);
  const payload = `${userId}:${expiry}:${hashFingerprint}`;
  const sig = createHmac("sha256", SECRET).update(payload).digest("hex");
  return Buffer.from(`${payload}:${sig}`).toString("base64url");
}

export function verifyPasswordResetToken(token: string, currentPasswordHash: string): { userId: number } | null {
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf8");
    const [userIdStr, expiryStr, hashFingerprint, sig] = decoded.split(":");
    if (!userIdStr || !expiryStr || !hashFingerprint || !sig) return null;
    const payload = `${userIdStr}:${expiryStr}:${hashFingerprint}`;
    const expected = createHmac("sha256", SECRET).update(payload).digest("hex");
    if (!safeEqual(sig, expected)) return null;
    if (Date.now() > Number(expiryStr)) return null;
    const expectedFingerprint = createHmac("sha256", SECRET).update(currentPasswordHash).digest("hex").slice(0, 16);
    if (!safeEqual(hashFingerprint, expectedFingerprint)) return null; // şifre zaten değişmiş
    return { userId: Number(userIdStr) };
  } catch {
    return null;
  }
}
