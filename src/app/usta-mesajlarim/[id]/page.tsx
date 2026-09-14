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
          contactVisible: true, businessName: true, contactPhone: true, contactAddress: true,
        },
      },
      messages: {
        select: { id: true, senderId: true, text: true, createdAt: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });
  if (!thread) notFound();

  const ustaUserId = thread.expertProfile.userId;
  if (userId !== thread.initiatorId && userId !== ustaUserId) notFound();

  const counterpartId = userId === thread.initiatorId ? ustaUserId : thread.initiatorId;
  // Önceden "engellendi" durumu yalnız İSTEMCİ state'inde (kullanıcı bu
  // oturumda "Engelle"ye bastıysa) tutuluyordu — sayfa yenilenince ya da
  // KARŞI TARAF sizi engellemişse arayüz hiç yansıtmıyordu (mesaj API'si
  // zaten 403 veriyordu ama ekran normal görünüyordu). Artık sunucu
  // tarafında gerçek durumu kontrol edip prop olarak geçiyoruz.
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

  const isInitiator = userId === thread.initiatorId;
  // "İletişim bilgisi doğru muydu?" sorusu yalnız usta gerçekten bir iletişim
  // bilgisi paylaşmışsa anlamlı — kullanıcı fark etti: paylaşılmamış bile
  // olsa soru soruluyordu, hem kafa karıştırıyor hem sahte bir "teyit"
  // kaydına yol açabiliyordu.
  const hasSharedContact = thread.expertProfile.contactVisible &&
    !!(thread.expertProfile.businessName || thread.expertProfile.contactPhone || thread.expertProfile.contactAddress);
  const existingFeedback = isInitiator && hasSharedContact
    ? await prisma.expertContactFeedback.findUnique({
        where: { profileId_userId: { profileId: thread.expertProfileId, userId } },
        select: { isAccurate: true },
      })
    : null;

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
        createdAt: m.createdAt.toISOString(),
      }))}
      initialBlockedByMe={!!blockedByMe}
      initialBlockedByThem={!!blockedByThem}
      contactFeedback={
        isInitiator && hasSharedContact
          ? { expertProfileId: thread.expertProfileId, currentValue: existingFeedback?.isAccurate ?? null }
          : null
      }
    />
  );
}
