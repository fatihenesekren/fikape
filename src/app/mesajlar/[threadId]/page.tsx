import { redirect, notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { stripModelGenRange } from "@/lib/modelDisplay";
import { isTradeMessagingEnabled } from "@/lib/features";
import { MessageForm } from "./MessageForm";
import { ThreadActions } from "./ThreadActions";
import { ReportButton } from "./ReportButton";
import { TradeRatingForm } from "./TradeRatingForm";

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
      tradeListing: { include: { product: { include: { brand: true, model: true } }, user: { select: { id: true, displayName: true } } } },
      // Mesajı atanın "ben bu aracımla teklif ediyorum" dediği kendi ilanı —
      // opsiyonel, hiç seçmediyse (ya da eski bir görüşmeyse) null (bkz.
      // kullanıcı geri bildirimi, schema.prisma MessageThread.initiatorListing notu).
      initiatorListing: {
        include: {
          product: { include: { brand: true, model: true } },
          userProduct: { select: { usageAmount: true, usageUnit: true } },
        },
      },
      initiator: { select: { id: true, displayName: true } },
      interestLostByUser: { select: { id: true, displayName: true } },
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
  const isInitiator = userId === thread.initiatorId;
  const counterpart = isInitiator ? thread.tradeListing.user : thread.initiator;
  const interestLostByMe = thread.interestLostByUserId === userId;
  const interestLostByOther = thread.interestLostByUserId != null && !interestLostByMe;

  // Takas sonrası karşılıklı değerlendirme daveti — ilan "Takas oldu" ile
  // kapandıysa ve bu kullanıcı bu görüşmeyi henüz değerlendirmediyse gösterilir.
  const canRate = thread.tradeListing.closeReason === "TRADED";
  const existingRating = canRate
    ? await prisma.tradeRating.findUnique({
        where: { threadId_raterId: { threadId, raterId: userId } },
        select: { id: true },
      })
    : null;

  return (
    <div className="max-w-2xl w-full mx-auto flex flex-col" style={{ minHeight: "100dvh" }}>
      <div className="px-4 pt-6 pb-3 border-b border-gray-100 flex items-center justify-between gap-2">
        <div>
          <h1 className="font-bold text-gray-900 text-sm">{vehicleName}</h1>
          <p className="text-xs text-gray-400">{thread.tradeListing.city}</p>
        </div>
        {!isBlocked && (
          <ThreadActions threadId={thread.id} showInterestLost={thread.interestLostByUserId == null} />
        )}
      </div>

      {/* Karşı tarafın teklif ettiği araç — sadece alıcı (ilan sahibi) için
          anlamlı, kendi ilanını zaten yukarıda görüyor. Mesajı atan hiç ilan
          seçmediyse (ya da bu, özellik öncesi açılmış eski bir görüşmeyse)
          "belirtilmedi" gösterilir (bkz. kullanıcı geri bildirimi). */}
      {!isInitiator && (
        <div className="px-4 py-3 bg-indigo-50/60 border-b border-indigo-100">
          <p className="text-[11px] font-bold text-indigo-800 mb-1">
            {counterpart?.displayName ?? "Kullanıcı"} teklif ettiği araç
          </p>
          {thread.initiatorListing ? (
            thread.initiatorListing.isActive ? (
              <Link
                href={`/takas/${thread.initiatorListing.id}`}
                className="text-sm font-semibold text-indigo-900 hover:underline"
              >
                {thread.initiatorListing.product.brand.name}{" "}
                {stripModelGenRange(thread.initiatorListing.product.model.name)}
                {thread.initiatorListing.product.year && ` ${thread.initiatorListing.product.year}`}
                {thread.initiatorListing.userProduct?.usageUnit === "km" &&
                  thread.initiatorListing.userProduct.usageAmount != null &&
                  ` · ${thread.initiatorListing.userProduct.usageAmount.toLocaleString("tr-TR")} km`}
                {" →"}
              </Link>
            ) : (
              <p className="text-sm text-gray-400">Bu ilan artık aktif değil.</p>
            )
          ) : (
            <p className="text-sm text-gray-400">Bu kullanıcı bir ilan belirtmedi.</p>
          )}
        </div>
      )}

      {interestLostByMe && (
        <p className="px-4 py-2 text-xs text-center text-gray-400 bg-gray-50 border-b border-gray-100">
          Bu görüşmeyle ilgini kaybettiğini belirttin.
        </p>
      )}
      {interestLostByOther && (
        <p className="px-4 py-2 text-xs text-center text-gray-400 bg-gray-50 border-b border-gray-100">
          {counterpart?.displayName ?? "Diğer taraf"} bu görüşmeyle ilgisini kaybettiğini belirtti.
        </p>
      )}

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

      {canRate && !existingRating && (
        <TradeRatingForm threadId={thread.id} counterpartName={counterpart?.displayName ?? "Kullanıcı"} />
      )}
    </div>
  );
}
