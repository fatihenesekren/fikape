import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createPasswordResetToken } from "@/lib/emailToken";
import { sendPasswordResetEmail } from "@/lib/email";
import { rateLimitByIp } from "@/lib/rateLimit";
import { forgotPasswordSchema, formatZodError } from "@/lib/schemas";

const RATE_LIMIT_COUNT = 5;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;

export async function POST(req: Request) {
  if (!rateLimitByIp(req, "forgot-password", RATE_LIMIT_COUNT, RATE_LIMIT_WINDOW_MS)) {
    return NextResponse.json({ error: "Çok fazla deneme yapıldı. Lütfen daha sonra tekrar deneyin." }, { status: 429 });
  }

  const parsed = forgotPasswordSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 });
  }
  const { email } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email }, select: { id: true, passwordHash: true } });

  // Kullanıcı bulunamasa bile aynı yanıtı dön (email enumeration önleme)
  if (user) {
    try {
      const token = createPasswordResetToken(user.id, user.passwordHash);
      await sendPasswordResetEmail(email, token);
    } catch (err) {
      console.error("Password reset email failed:", err);
    }
  }

  return NextResponse.json({ ok: true });
}
