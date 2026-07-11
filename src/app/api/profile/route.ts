import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Giriş gerekli" }, { status: 401 });
  }

  const { displayName } = await req.json();
  const trimmed = displayName?.trim();
  if (!trimmed || trimmed.length < 3 || trimmed.length > 40) {
    return NextResponse.json({ error: "Ad 3-40 karakter olmalı" }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: Number(session.user.id) },
    data: { displayName: trimmed },
  });

  return NextResponse.json({ ok: true });
}
