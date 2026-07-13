import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Giriş gerekli" }, { status: 401 });

  const userId = Number(session.user.id);

  let id: number | undefined;
  try {
    const body = await req.json();
    if (typeof body?.id === "number") id = body.id;
  } catch {
    // gövde boş/JSON değil — tümünü işaretle
  }

  await prisma.notification.updateMany({
    where: { userId, isRead: false, ...(id ? { id } : {}) },
    data: { isRead: true },
  });

  return NextResponse.json({ ok: true });
}
