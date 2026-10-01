import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, rateLimitByEmail } from "@/lib/rateLimit";
import { logAccessRaw } from "@/lib/accessLog";

// bcrypt(12) çıktısı biçiminde, hiçbir parolaya karşılık gelmeyen sabit hash (zamanlama eşitleme için).
const SAHTE_HASH = "$2b$12$CwTycUXWue0Thq9StjUM0uJ8E1q0t0r8mY3rYzQ0x6h8lS9mQ2yQe";

export interface VerifiedUser {
  id: string;
  email: string;
  name: string;
  image: string | null;
  trustLevel: number;
  passwordChangedAt: number | null;
}

// auth.ts'teki NextAuth Credentials provider'ından çıkarıldı — mobil bir giriş
// endpoint'i (örn. /api/mobile/login) eklendiğinde de aynı fonksiyon kullanılabilir,
// böylece rate-limit/normalize mantığı iki yerde tekrarlanmaz.
export async function verifyCredentials(
  email: string,
  password: string,
  ip: string | null
): Promise<VerifiedUser | null> {
  const normalizedEmail = email.toLowerCase();

  // Brute-force koruması: hem e-posta hem IP bazlı (biri atlatılsa diğeri tutar)
  if (!(await rateLimitByEmail(normalizedEmail, "login", 5, 15 * 60 * 1000))) return null;
  if (ip && !(await checkRateLimit(`login:${ip}`, 20, 15 * 60 * 1000))) return null;

  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  // Kullanıcı yokken de bcrypt çalıştırılır: yanıt süresi farkından hesap var/yok anlaşılmasın.
  const valid = await bcrypt.compare(password, user?.passwordHash ?? SAHTE_HASH);
  if (!user || !valid) return null;
  // Banlı hesap giriş yapamaz (yorum/soru/öneri/yükleme gibi yazma yolları ban kontrolü yapmıyordu).
  if (user.isBanned) return null;

  // 5651 trafik logu — başarılı giriş (bkz. lib/accessLog.ts)
  await logAccessRaw({ action: "LOGIN", userId: user.id, ip, path: "/api/auth/callback/credentials" });

  return {
    id: String(user.id),
    email: user.email,
    name: user.displayName ?? user.email,
    image: user.avatarUrl ?? null,
    trustLevel: user.trustLevel,
    passwordChangedAt: user.passwordChangedAt?.getTime() ?? null,
  };
}
