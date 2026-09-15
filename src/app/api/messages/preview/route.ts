import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { stripModelGenRange } from "@/lib/modelDisplay";

const PREVIEW_LIMIT = 6;

// Header'daki mesaj ikonu artık zil gibi bir önizleme paneli açıyor
// (kullanıcı isteği — önceden düz bir /mesajlar linkiydi). Takas ve Usta
// mesajları AYRI sekmeler yerine tek, en-son-üstte karışık bir listede
// gösteriliyor (bildirim çanının "tüm tipler karışık" mantığıyla aynı) —
// her satırın türü (Takas/Usta) küçük bir etiketle ayırt ediliyor.
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
        tradeListing: { select: { user: { select: { id: true, displayName: true, avatarUrl: true } }, product: { select: { brand: { select: { name: true } }, model: { select: { name: true } } } } } },
        initiator: { select: { id: true, displayName: true, avatarUrl: true } },
        messages: { orderBy: { createdAt: "desc" }, take: 1, select: { text: true, senderId: true } },
        _count: { select: { messages: { where: { isRead: false, senderId: { not: userId } } } } },
      },
      orderBy: { lastMessageAt: "desc" },
      take: PREVIEW_LIMIT,
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
      take: PREVIEW_LIMIT,
    }),
    prisma.message.count({
      where: { isRead: false, senderId: { not: userId }, thread: { OR: [{ initiatorId: userId }, { tradeListing: { userId } }] } },
    }),
    prisma.expertMessage.count({
      where: { isRead: false, senderId: { not: userId }, thread: { OR: [{ initiatorId: userId }, { expertProfile: { userId } }] } },
    }),
  ]);

  const takasRows = takasThreads.map((t) => {
    const isInitiator = t.tradeListing.user.id !== userId;
    const counterpart = isInitiator ? t.tradeListing.user : t.initiator;
    const last = t.messages[0];
    const carLabel = `${t.tradeListing.product.brand.name} ${stripModelGenRange(t.tradeListing.product.model.name)}`;
    return {
      id: `takas-${t.id}`,
      kind: "takas" as const,
      href: `/mesajlar/${t.id}`,
      counterpartName: counterpart.displayName,
      counterpartAvatarUrl: counterpart.avatarUrl,
      counterpartSeed: String(counterpart.id),
      subtitle: carLabel,
      lastMessage: last ? `${last.senderId === userId ? "Sen: " : ""}${last.text}` : "Henüz mesaj yok",
      unreadCount: t._count.messages,
      when: t.lastMessageAt,
    };
  });

  const ustaRows = ustaThreads.map((t) => {
    const isUsta = t.expertProfile.userId === userId;
    const counterpart = isUsta ? t.initiator : t.expertProfile.user;
    const last = t.messages[0];
    return {
      id: `usta-${t.id}`,
      kind: "usta" as const,
      href: `/usta-mesajlarim/${t.id}`,
      counterpartName: counterpart.displayName,
      counterpartAvatarUrl: counterpart.avatarUrl,
      counterpartSeed: String(counterpart.id),
      subtitle: t.expertProfile.headline,
      lastMessage: last ? `${last.senderId === userId ? "Sen: " : ""}${last.text}` : "Henüz mesaj yok",
      unreadCount: t._count.messages,
      when: t.lastMessageAt,
    };
  });

  const threads = [...takasRows, ...ustaRows]
    .sort((a, b) => new Date(b.when).getTime() - new Date(a.when).getTime())
    .slice(0, PREVIEW_LIMIT);

  return NextResponse.json({ unreadCount: takasUnread + ustaUnread, threads });
}
