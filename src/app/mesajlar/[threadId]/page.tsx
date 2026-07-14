import { redirect, notFound } from "next/navigation";
import type { Metadata } from "next";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { stripModelGenRange } from "@/lib/modelDisplay";
import { isTradeMessagingEnabled } from "@/lib/features";
import { MessageForm } from "./MessageForm";
import { ThreadActions } from "./ThreadActions";
import { ReportButton } from "./ReportButton";

export const metadata: Metadata = { title: "Görüşme", robots: { index: false } };

export default async function ThreadPage({
  params,
}: {
  params: Promise<{ threadId: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/giris");

  const { threadId: threadIdParam } = await params;
  const threadId = parseInt(threadIdParam);
  if (isNaN(threadId)) notFound();

  const userId = Number(session.user.id);

  const thread = await prisma.messageThread.findUnique({
    where: { id: threadId },
    include: {
      tradeListing: { include: { product: { include: { brand: true, model: true } } } },
      initiator: { select: { id: true, displayName: true } },
      messages: { orderBy: { createdAt: "asc" }, include: { sender: { select: { id: true, displayName: true } } } },
    },
  });

  if (!thread || (thread.initiatorId !== userId && thread.tradeListing.userId !== userId)) {
    notFound();
  }

  await prisma.message.updateMany({
    where: { threadId, senderId: { not: userId }, isRead: false },
    data: { isRead: true },
  }).catch(() => {});

  const vehicleName = `${thread.tradeListing.product.brand.name} ${stripModelGenRange(thread.tradeListing.product.model.name)}`;
  const isBlocked = thread.blockedByUserId != null;
  const isListingClosed = !thread.tradeListing.isActive;
  const canMessage = !isBlocked && !isListingClosed && isTradeMessagingEnabled();

  return (
    <div className="max-w-2xl w-full mx-auto flex flex-col" style={{ minHeight: "100dvh" }}>
      <div className="px-4 pt-6 pb-3 border-b border-gray-100 flex items-center justify-between gap-2">
        <div>
          <h1 className="font-bold text-gray-900 text-sm">{vehicleName}</h1>
          <p className="text-xs text-gray-400">{thread.tradeListing.city}</p>
        </div>
        {!isBlocked && <ThreadActions threadId={thread.id} />}
      </div>

      <div className="flex-1 px-4 py-4 space-y-3">
        {thread.messages.map((m) => {
          const isMine = m.senderId === userId;
          return (
            <div key={m.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${isMine ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-900"}`}>
                <p>{m.text}</p>
                {!isMine && (
                  <div className="mt-1">
                    <ReportButton messageId={m.id} />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {isBlocked ? (
        <p className="p-4 text-xs text-gray-400 text-center">Bu görüşme sonlandırıldı.</p>
      ) : isListingClosed ? (
        <p className="p-4 text-xs text-gray-400 text-center">Bu ilan artık takasa açık değil, mesaj gönderemezsiniz.</p>
      ) : !isTradeMessagingEnabled() ? (
        <p className="p-4 text-xs text-gray-400 text-center">Mesajlaşma özelliği geçici olarak kapalı.</p>
      ) : (
        canMessage && <MessageForm threadId={thread.id} />
      )}
    </div>
  );
}
