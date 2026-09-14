import { redirect, notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ExpertThreadView } from "./ExpertThreadView";

export const metadata = { title: "Görüşme — fikape", robots: { index: false } };

export default async function ExpertMessageThreadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session) redirect("/giris");

  const { id } = await params;
  const threadId = parseInt(id);
  if (isNaN(threadId)) notFound();

  const userId = parseInt(session.user.id);

  const thread = await prisma.expertMessageThread.findUnique({
    where: { id: threadId },
    select: {
      id: true, initiatorId: true, expertProfileId: true,
      initiator: { select: { displayName: true, avatarUrl: true } },
      expertProfile: {
        select: {
          slug: true, headline: true, userId: true, user: { select: { displayName: true, avatarUrl: true } },
        },
      },
      messages: {
        select: { id: true, senderId: true, text: true, createdAt: true, isRead: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });
  if (!thread) notFound();

  const ustaUserId = thread.expertProfile.userId;
  if (userId !== thread.initiatorId && userId !== ustaUserId) notFound();

  const counterpartId = userId === thread.initiatorId ? ustaUserId : thread.initiatorId;
  // "Engellendi" durumu sunucu tarafında gerçek BlockedUser tablosundan
  // kontrol edilir (client state'e güvenilmez — sayfa yenilenince veya
  // KARŞI TARAF sizi engellemişse de doğru yansısın diye).
  const [blockedByMe, blockedByThem] = await Promise.all([
    prisma.blockedUser.findUnique({
      where: { blockerId_blockedId: { blockerId: userId, blockedId: counterpartId } },
      select: { id: true },
    }),
    prisma.blockedUser.findUnique({
      where: { blockerId_blockedId: { blockerId: counterpartId, blockedId: userId } },
      select: { id: true },
    }),
  ]);

  // "── Yeni ──" ayıracı için: okundu işaretlemeden ÖNCE ilk okunmamış
  // (karşı taraftan gelen) mesajı yakala — Takas Mesajlarım'daki aynı desen.
  const firstUnreadId = thread.messages.find((m) => m.senderId !== userId && !m.isRead)?.id ?? null;

  await prisma.expertMessage.updateMany({
    where: { threadId, senderId: { not: userId }, isRead: false },
    data: { isRead: true },
  });

  const counterpartName = userId === thread.initiatorId
    ? (thread.expertProfile.user.displayName ?? "Usta")
    : (thread.initiator.displayName ?? "Kullanıcı");
  const counterpartAvatarUrl = userId === thread.initiatorId
    ? thread.expertProfile.user.avatarUrl
    : thread.initiator.avatarUrl;

  const lastMineId = [...thread.messages].reverse().find((m) => m.senderId === userId)?.id ?? null;

  return (
    <ExpertThreadView
      threadId={thread.id}
      counterpartName={counterpartName}
      counterpartAvatarUrl={counterpartAvatarUrl}
      counterpartSeed={String(counterpartId)}
      expertHeadline={thread.expertProfile.headline}
      messages={thread.messages.map((m) => ({
        id: m.id,
        text: m.text,
        isOwn: m.senderId === userId,
        isRead: m.isRead,
        createdAt: m.createdAt.toISOString(),
      }))}
      firstUnreadId={firstUnreadId}
      lastMineId={lastMineId}
      initialBlockedByMe={!!blockedByMe}
      initialBlockedByThem={!!blockedByThem}
    />
  );
}
