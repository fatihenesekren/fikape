import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { stripModelGenRange } from "@/lib/modelDisplay";

// Header'daki mesaj ikonu artık zil gibi bir önizleme paneli açıyor
// (kullanıcı isteği — önceden düz bir /mesajlar linkiydi). Takas ve Usta
// mesajları AYRI sekmeler yerine tek, en-son-üstte karışık bir listede
// gösteriliyor (bildirim çanının "tüm tipler karışık" mantığıyla aynı) —
// her satırın türü (Takas/Usta) küçük bir etiketle ayırt ediliyor.

// Her türden bu kadarını sorgudan çek — birleştirip sıralamadan önceki havuz.
// PREVIEW_LIMIT'ten büyük tutuluyor ki iki tür karışık sıralanınca (okunmamış
// önce) hiçbiri "diğer türün son 6'sı arasına giremediği" için kaybolmasın
// (3 ajanlı denetimde bulunan gerçek bir sorun — bkz. commit mesajı).
const FETCH_POOL = 10;
const PREVIEW_LIMIT = 8;

export interface MessagePreviewItem {
  id: string;
  kind: "takas" | "usta";
  href: string;
  counterpartName: string | null;
  counterpartAvatarUrl: string | null;
  counterpartSeed: string;
  subtitle: string | null;
  closed: boolean;
  lastMessage: string;
  unreadCount: number;
  when: string;
}

export interface MessagePreviewResponse {
  unreadCount: number;
  hiddenUnreadCount: number;
  threads: MessagePreviewItem[];
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Giriş gerekli" }, { status: 401 });

  const userId = Number(session.user.id);

  const [takasThreads, ustaThreads, takasUnread, ustaUnread] = await Promise.all([
    prisma.messageThread.findMany({
      where: { OR: [{ initiatorId: userId }, { tradeListing: { userId } }] },
      select: {
        id: true,
        lastMessageAt: true,
        tradeListing: {
          select: {
            isActive: true,
            user: { select: { id: true, displayName: true, avatarUrl: true } },
            product: { select: { brand: { select: { name: true } }, model: { select: { name: true } } } },
          },
        },
        initiator: { select: { id: true, displayName: true, avatarUrl: true } },
        messages: { orderBy: { createdAt: "desc" }, take: 1, select: { text: true, senderId: true } },
        _count: { select: { messages: { where: { isRead: false, senderId: { not: userId } } } } },
      },
      orderBy: { lastMessageAt: "desc" },
      take: FETCH_POOL,
    }),
    prisma.expertMessageThread.findMany({
      where: { OR: [{ initiatorId: userId }, { expertProfile: { userId } }] },
      select: {
        id: true,
        lastMessageAt: true,
        initiator: { select: { id: true, displayName: true, avatarUrl: true } },
        expertProfile: { select: { userId: true, headline: true, user: { select: { id: true, displayName: true, avatarUrl: true } } } },
        messages: { orderBy: { createdAt: "desc" }, take: 1, select: { text: true, senderId: true } },
        _count: { select: { messages: { where: { isRead: false, senderId: { not: userId } } } } },
      },
      orderBy: { lastMessageAt: "desc" },
      take: FETCH_POOL,
    }),
    prisma.message.count({
      where: { isRead: false, senderId: { not: userId }, thread: { OR: [{ initiatorId: userId }, { tradeListing: { userId } }] } },
    }),
    prisma.expertMessage.count({
      where: { isRead: false, senderId: { not: userId }, thread: { OR: [{ initiatorId: userId }, { expertProfile: { userId } }] } },
    }),
  ]);

  const takasRows: MessagePreviewItem[] = takasThreads.map((t) => {
    const isInitiator = t.tradeListing.user.id !== userId;
    const counterpart = isInitiator ? t.tradeListing.user : t.initiator;
    const last = t.messages[0];
    const carLabel = `${t.tradeListing.product.brand.name} ${stripModelGenRange(t.tradeListing.product.model.name)}`;
    return {
      id: `takas-${t.id}`,
      kind: "takas",
      href: `/mesajlar/${t.id}`,
      counterpartName: counterpart.displayName,
      counterpartAvatarUrl: counterpart.avatarUrl,
      counterpartSeed: String(counterpart.id),
      subtitle: carLabel,
      // İlan kapanmışsa (mesajlar/page.tsx'teki "Kapandı" rozetiyle aynı
      // bilgi) önizlemede de belirtiliyor — önceden bu alan select'e bile
      // alınmamıştı (3 ajanlı denetim bulgusu).
      closed: !t.tradeListing.isActive,
      lastMessage: last ? `${last.senderId === userId ? "Sen: " : ""}${last.text}` : "Henüz mesaj yok",
      unreadCount: t._count.messages,
      when: t.lastMessageAt.toISOString(),
    };
  });

  const ustaRows: MessagePreviewItem[] = ustaThreads.map((t) => {
    const isUsta = t.expertProfile.userId === userId;
    const counterpart = isUsta ? t.initiator : t.expertProfile.user;
    const last = t.messages[0];
    return {
      id: `usta-${t.id}`,
      kind: "usta",
      href: `/usta-mesajlarim/${t.id}`,
      counterpartName: counterpart.displayName,
      counterpartAvatarUrl: counterpart.avatarUrl,
      counterpartSeed: String(counterpart.id),
      subtitle: t.expertProfile.headline,
      closed: false,
      lastMessage: last ? `${last.senderId === userId ? "Sen: " : ""}${last.text}` : "Henüz mesaj yok",
      unreadCount: t._count.messages,
      when: t.lastMessageAt.toISOString(),
    };
  });

  // Okunmamış olanlar önce, sonra en son mesaja göre — böylece rozetin
  // saydığı okunmamış görüşmeler, salt tarih sıralamasında diğer türün
  // dolgusu tarafından listeden itilemez (3 ajanlı denetimde bulunan
  // gerçek bir sorun: rozet "10" derken önizlemede hiçbiri görünmeyebiliyordu).
  const allRows = [...takasRows, ...ustaRows].sort((a, b) => {
    if ((a.unreadCount > 0) !== (b.unreadCount > 0)) return a.unreadCount > 0 ? -1 : 1;
    return new Date(b.when).getTime() - new Date(a.when).getTime();
  });
  const threads = allRows.slice(0, PREVIEW_LIMIT);

  const unreadCount = takasUnread + ustaUnread;
  const shownUnread = threads.reduce((sum, t) => sum + t.unreadCount, 0);
  // Yukarıdaki önceliklendirmeye rağmen (çok sayıda okunmamış görüşme varsa)
  // hâlâ sığmayan olabilir — panelde dürüstçe "+N okunmamış daha" notu için.
  const hiddenUnreadCount = Math.max(0, unreadCount - shownUnread);

  const response: MessagePreviewResponse = { unreadCount, hiddenUnreadCount, threads };
  return NextResponse.json(response);
}
