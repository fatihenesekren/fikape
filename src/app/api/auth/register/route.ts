import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createVerificationToken } from "@/lib/emailToken";
import { sendVerificationEmail } from "@/lib/email";
import { rateLimitByIp } from "@/lib/rateLimit";
import { registerSchema, formatZodError } from "@/lib/schemas";

const RATE_LIMIT_COUNT = 5;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;

export async function POST(req: Request) {
  if (!rateLimitByIp(req, "register", RATE_LIMIT_COUNT, RATE_LIMIT_WINDOW_MS)) {
    return NextResponse.json({ error: "Çok fazla deneme yapıldı. Lütfen daha sonra tekrar deneyin." }, { status: 429 });
  }

  const parsed = registerSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 });
  }
  const { email, password, displayName, ref } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "Bu e-posta zaten kayıtlı." }, { status: 409 });
  }

  const referrer = ref
    ? await prisma.user.findUnique({ where: { referralCode: ref }, select: { id: true } })
    : null;

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      displayName: displayName?.trim() || null,
      trustLevel: 1,
      referralCode: randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase(),
      referredByUserId: referrer?.id ?? null,
      consentLogs: {
        create: [
          { consentType: "PRIVACY_POLICY",   isGranted: true },
          { consentType: "TERMS_OF_SERVICE",  isGranted: true },
        ],
      },
    },
  });

  // E-posta doğrulama linki gönder (hata olsa da kayıt başarılı sayılır)
  try {
    const token = createVerificationToken(user.id);
    await sendVerificationEmail(email, token);
  } catch (err) {
    console.error("Verification email failed:", err);
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
