import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// Kullanıcının usta-mesajlaşma gelen kutusu — hem "mesaj başlattığı" hem
// (usta ise) "kendisine gelen" thread'ler tek listede.
export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Giriş gerekli." }, { status: 401 });
  const userId = parseInt(session.user.id);

  const threads = await prisma.expertMessageThread.findMany({
    where: { OR: [{ initiatorId: userId }, { expertProfile: { userId } }] },
    select: {
      id: true, initiatorId: true, lastMessageAt: true,
      initiator: { select: { displayName: true } },
      expertProfile: {
        select: { slug: true, headline: true, userId: true, user: { select: { displayName: true } } },
      },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { text: true, senderId: true, isRead: true },
      },
    },
    orderBy: { lastMessageAt: "desc" },
  });

  const result = threads.map((t) => {
    const isUsta = t.expertProfile.userId === userId;
    const counterpartName = isUsta
      ? (t.initiator.displayName ?? "Kullanıcı")
      : (t.expertProfile.user.displayName ?? "Usta");
    const last = t.messages[0];
    return {
      id: t.id,
      counterpartName,
      expertHeadline: t.expertProfile.headline,
      isUsta,
      lastMessagePreview: last?.text.slice(0, 80) ?? "",
      hasUnread: !!last && last.senderId !== userId && !last.isRead,
      lastMessageAt: t.lastMessageAt.toISOString(),
    };
  });

  return NextResponse.json(result);
}
