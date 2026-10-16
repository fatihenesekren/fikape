import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createPasswordResetToken } from "@/lib/emailToken";
import { sendPasswordResetEmail } from "@/lib/email";
import { arkaPlandaCalistir } from "@/lib/arkaPlan";
import { rateLimitByIp, rateLimitByEmail } from "@/lib/rateLimit";
import { forgotPasswordSchema, formatZodError } from "@/lib/schemas";

const RATE_LIMIT_COUNT = 5;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;

export async function POST(req: Request) {
  if (!(await rateLimitByIp(req, "forgot-password", RATE_LIMIT_COUNT, RATE_LIMIT_WINDOW_MS))) {
    return NextResponse.json({ error: "Çok fazla deneme yapıldı. Lütfen daha sonra tekrar deneyin." }, { status: 429 });
  }

  const parsed = forgotPasswordSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 });
  }
  const { email } = parsed.data;

  // E-posta bazlı ikinci limit katmanı — IP-limit'i çoklu IP/VPN ile aşan bir
  // saldırganın tek bir kurbanın e-postasına sınırsız mail göndermesini engeller.
  // Enumeration önleme prensibiyle tutarlı: limit aşılsa da her zaman aynı {ok:true} dönülür.
  if (!(await rateLimitByEmail(email, "forgot-password", 3, RATE_LIMIT_WINDOW_MS))) {
    return NextResponse.json({ ok: true });
  }

  const user = await prisma.user.findUnique({ where: { email }, select: { id: true, passwordHash: true } });

  // Kullanıcı bulunamasa bile aynı yanıtı dön (email enumeration önleme)
  if (user) {
    // E-posta gönderimi yanıttan sonra yapılır: gönderim süresi "bu hesap var" bilgisini zamanlamayla ele vermesin.
    const token = createPasswordResetToken(user.id, user.passwordHash);
    arkaPlandaCalistir(() => sendPasswordResetEmail(email, token));
  }

  return NextResponse.json({ ok: true });
}
