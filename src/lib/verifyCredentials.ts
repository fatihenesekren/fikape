import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, rateLimitByEmail } from "@/lib/rateLimit";

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
  if (!rateLimitByEmail(normalizedEmail, "login", 5, 15 * 60 * 1000)) return null;
  if (ip && !checkRateLimit(`login:${ip}`, 20, 15 * 60 * 1000)) return null;

  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (!user) return null;
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return null;

  return {
    id: String(user.id),
    email: user.email,
    name: user.displayName ?? user.email,
    image: user.avatarUrl ?? null,
    trustLevel: user.trustLevel,
    passwordChangedAt: user.passwordChangedAt?.getTime() ?? null,
  };
}
