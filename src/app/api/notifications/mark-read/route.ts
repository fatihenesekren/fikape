import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Giriş gerekli" }, { status: 401 });

  await prisma.notification.updateMany({
    where: { userId: Number(session.user.id), isRead: false },
    data: { isRead: true },
  });

  return NextResponse.json({ ok: true });
}
