import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// Hesap menüsündeki "Mesajlarım" girişi için okunmamış mesaj sayısı — sayfanın
// kendisi (/mesajlar) zaten çalışıyordu ama nav'da hiç linki yoktu (bkz. boşluk
// raporu, YÜKSEK madde). Bildirim çanı ile aynı desen: küçük, ayrı bir uç nokta.
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Giriş gerekli" }, { status: 401 });

  const userId = Number(session.user.id);

  const count = await prisma.message.count({
    where: {
      isRead: false,
      senderId: { not: userId },
      thread: { OR: [{ initiatorId: userId }, { tradeListing: { userId } }] },
    },
  });

  return NextResponse.json({ count });
}
