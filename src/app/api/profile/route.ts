import { kullaniciLimiti } from "@/lib/userRateLimit";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { displayNameSchema, formatZodError } from "@/lib/schemas";

export async function PATCH(req: NextRequest) {
  const session = await auth();
  const limitYaniti = await kullaniciLimiti(session, "profile", 30, 60 * 60 * 1000);
  if (limitYaniti) return limitYaniti;
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Giriş gerekli" }, { status: 401 });
  }

  const { displayName } = (await req.json().catch(() => null)) ?? {};
  const parsed = displayNameSchema.safeParse(displayName);
  if (!parsed.success) {
    return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: Number(session.user.id) },
    data: { displayName: parsed.data },
  });

  return NextResponse.json({ ok: true });
}
