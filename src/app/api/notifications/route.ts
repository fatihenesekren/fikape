import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Giriş gerekli" }, { status: 401 });

  const unreadCount = await prisma.notification.count({
    where: { userId: Number(session.user.id), isRead: false },
  });

  return NextResponse.json({ unreadCount });
}
