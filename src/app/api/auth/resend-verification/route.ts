import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createVerificationToken } from "@/lib/emailToken";
import { sendVerificationEmail } from "@/lib/email";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Giriş gerekli" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { id: Number(session.user.id) } });
  if (!user || user.emailVerifiedAt) {
    return NextResponse.json({ ok: true });
  }

  const token = createVerificationToken(user.id);
  await sendVerificationEmail(user.email, token);

  return NextResponse.json({ ok: true });
}
