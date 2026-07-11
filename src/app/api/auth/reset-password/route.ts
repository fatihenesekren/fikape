import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { verifyPasswordResetToken } from "@/lib/emailToken";
import { rateLimitByIp } from "@/lib/rateLimit";
import { resetPasswordSchema, formatZodError } from "@/lib/schemas";

const RATE_LIMIT_COUNT = 10;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;

export async function POST(req: Request) {
  if (!rateLimitByIp(req, "reset-password", RATE_LIMIT_COUNT, RATE_LIMIT_WINDOW_MS)) {
    return NextResponse.json({ error: "Çok fazla deneme yapıldı. Lütfen daha sonra tekrar deneyin." }, { status: 429 });
  }

  const parsed = resetPasswordSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 });
  }
  const { token, password } = parsed.data;

  // Token'daki userId'yi önce imza doğrulamadan okuyamayız — bu yüzden
  // önce ham decode ile userId çıkarılır, sonra o kullanıcının güncel
  // passwordHash'i ile birlikte tam doğrulama yapılır.
  let userId: number;
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf8");
    userId = Number(decoded.split(":")[0]);
    if (!Number.isFinite(userId)) throw new Error("invalid");
  } catch {
    return NextResponse.json({ error: "Geçersiz veya süresi dolmuş bağlantı." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, passwordHash: true } });
  if (!user) {
    return NextResponse.json({ error: "Geçersiz veya süresi dolmuş bağlantı." }, { status: 400 });
  }

  const verified = verifyPasswordResetToken(token, user.passwordHash);
  if (!verified) {
    return NextResponse.json({ error: "Geçersiz veya süresi dolmuş bağlantı." }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });

  return NextResponse.json({ ok: true });
}
