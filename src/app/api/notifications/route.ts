import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { resolveLiveNotificationMessages } from "@/lib/notification";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Giriş gerekli" }, { status: 401 });

  const userId = Number(session.user.id);

  const [unreadCount, notificationsRaw] = await Promise.all([
    prisma.notification.count({ where: { userId, isRead: false } }),
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 6,
      select: { id: true, type: true, message: true, link: true, isRead: true, createdAt: true, expertNoteId: true },
    }),
  ]);
  // Not başlığı sonradan düzeltilmişse bildirim metni de güncel kalsın diye
  // (kullanıcı fark etti) — tek toplu sorgu, N+1 değil.
  const notifications = await resolveLiveNotificationMessages(notificationsRaw);

  return NextResponse.json({ unreadCount, notifications });
}
