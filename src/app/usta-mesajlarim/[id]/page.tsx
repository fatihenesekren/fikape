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
      initiator: { select: { displayName: true } },
      expertProfile: { select: { slug: true, headline: true, userId: true, user: { select: { displayName: true } } } },
      messages: {
        select: { id: true, senderId: true, text: true, createdAt: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });
  if (!thread) notFound();

  const ustaUserId = thread.expertProfile.userId;
  if (userId !== thread.initiatorId && userId !== ustaUserId) notFound();

  await prisma.expertMessage.updateMany({
    where: { threadId, senderId: { not: userId }, isRead: false },
    data: { isRead: true },
  });

  const counterpartName = userId === thread.initiatorId
    ? (thread.expertProfile.user.displayName ?? "Usta")
    : (thread.initiator.displayName ?? "Kullanıcı");

  const isInitiator = userId === thread.initiatorId;
  const existingFeedback = isInitiator
    ? await prisma.expertContactFeedback.findUnique({
        where: { profileId_userId: { profileId: thread.expertProfileId, userId } },
        select: { isAccurate: true },
      })
    : null;

  return (
    <ExpertThreadView
      threadId={thread.id}
      counterpartName={counterpartName}
      expertHeadline={thread.expertProfile.headline}
      messages={thread.messages.map((m) => ({
        id: m.id,
        text: m.text,
        isOwn: m.senderId === userId,
        createdAt: m.createdAt.toISOString(),
      }))}
      contactFeedback={
        isInitiator
          ? { expertProfileId: thread.expertProfileId, currentValue: existingFeedback?.isAccurate ?? null }
          : null
      }
    />
  );
}
