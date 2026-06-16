import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const { email, password, displayName } = await req.json();

  if (!email || !password) {
    return NextResponse.json({ error: "E-posta ve şifre zorunludur." }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "Şifre en az 8 karakter olmalıdır." }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "Bu e-posta zaten kayıtlı." }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.user.create({
    data: {
      email,
      passwordHash,
      displayName: displayName?.trim() || null,
      trustLevel: 1,
      consentLogs: {
        create: [
          { consentType: "PRIVACY_POLICY",   isGranted: true },
          { consentType: "TERMS_OF_SERVICE",  isGranted: true },
        ],
      },
    },
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}
