import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// Hesap menüsündeki "Mesajlarım" girişi için okunmamış mesaj sayısı — sayfanın
// kendisi (/mesajlar) zaten çalışıyordu ama nav'da hiç linki yoktu (bkz. boşluk
// raporu, YÜKSEK madde). Bildirim çanı ile aynı desen: küçük, ayrı bir uç nokta.
//
// /mesajlar Takas+Usta sekmeli hale gelince (bkz. feature_usta_gorusleri_ilerleme)
// bu sayaç da ikisini toplar — önceden yalnız Takas mesajlarını sayıyordu,
// bir ustadan gelen cevap header rozetinde hiç görünmüyordu.
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Giriş gerekli" }, { status: 401 });

  const userId = Number(session.user.id);

  const [takas, usta] = await Promise.all([
    prisma.message.count({
      where: {
        isRead: false,
        senderId: { not: userId },
        thread: { OR: [{ initiatorId: userId }, { tradeListing: { userId } }] },
      },
    }),
    prisma.expertMessage.count({
      where: {
        isRead: false,
        senderId: { not: userId },
        thread: { OR: [{ initiatorId: userId }, { expertProfile: { userId } }] },
      },
    }),
  ]);

  return NextResponse.json({ count: takas + usta, breakdown: { takas, usta } });
}
