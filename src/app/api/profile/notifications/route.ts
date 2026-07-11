import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Giriş gerekli" }, { status: 401 });
  }

  const { enabled } = await req.json();
  if (typeof enabled !== "boolean") {
    return NextResponse.json({ error: "Geçersiz istek" }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: Number(session.user.id) },
    data: { emailNotificationsEnabled: enabled },
  });

  return NextResponse.json({ ok: true, enabled });
}
