import { createHmac, timingSafeEqual } from "crypto";

// Amaca özel anahtar tanımlıysa (EMAIL_TOKEN_SECRET) e-posta/şifre sıfırlama token imzası JWT anahtarından ayrılır.
const SECRET = (process.env.EMAIL_TOKEN_SECRET || process.env.AUTH_SECRET)!;

// Alan ayrımı: doğrulama ve sıfırlama token'ları aynı anahtarla imzalanır; imzaya amaç öneki katılır ki biri diğerinin yerine
// kullanılamasın (ayrıştırma biçimindeki parça sayısı farkına güvenilmez).
const ALAN_DOGRULAMA = "email-verify-v2";
const ALAN_SIFIRLAMA = "password-reset-v2";
function imzala(alan: string, veri: string): string {
  return createHmac("sha256", SECRET).update(`${alan}|${veri}`).digest("hex");
}

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
  const sig = imzala(ALAN_DOGRULAMA, payload);
  return Buffer.from(`${payload}:${sig}`).toString("base64url");
}

export function verifyEmailToken(token: string): { userId: number } | null {
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf8");
    const [userIdStr, expiryStr, sig] = decoded.split(":");
    if (!userIdStr || !expiryStr || !sig) return null;
    const payload = `${userIdStr}:${expiryStr}`;
    const expected = imzala(ALAN_DOGRULAMA, payload);
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
  const hashFingerprint = imzala(ALAN_SIFIRLAMA + "-fp", currentPasswordHash).slice(0, 16);
  const payload = `${userId}:${expiry}:${hashFingerprint}`;
  const sig = imzala(ALAN_SIFIRLAMA, payload);
  return Buffer.from(`${payload}:${sig}`).toString("base64url");
}

export function verifyPasswordResetToken(token: string, currentPasswordHash: string): { userId: number } | null {
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf8");
    const [userIdStr, expiryStr, hashFingerprint, sig] = decoded.split(":");
    if (!userIdStr || !expiryStr || !hashFingerprint || !sig) return null;
    const payload = `${userIdStr}:${expiryStr}:${hashFingerprint}`;
    const expected = imzala(ALAN_SIFIRLAMA, payload);
    if (!safeEqual(sig, expected)) return null;
    if (Date.now() > Number(expiryStr)) return null;
    const expectedFingerprint = imzala(ALAN_SIFIRLAMA + "-fp", currentPasswordHash).slice(0, 16);
    if (!safeEqual(hashFingerprint, expectedFingerprint)) return null; // şifre zaten değişmiş
    return { userId: Number(userIdStr) };
  } catch {
    return null;
  }
}
