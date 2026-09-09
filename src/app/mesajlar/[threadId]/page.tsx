import { redirect, notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Avatar } from "@/components/Avatar";
import { stripModelGenRange } from "@/lib/modelDisplay";
import { isTradeMessagingEnabled } from "@/lib/features";
import { MessageThread } from "./MessageThread";
import { ThreadActions } from "./ThreadActions";
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
      tradeListing: {
        include: {
          product: { include: { brand: true, model: true } },
          user: { select: { id: true, displayName: true, avatarUrl: true } },
        },
      },
      // Mesajı atanın "ben bu aracımla teklif ediyorum" dediği kendi ilanı —
      // opsiyonel, hiç seçmediyse (ya da eski bir görüşmeyse) null (bkz.
      // kullanıcı geri bildirimi, schema.prisma MessageThread.initiatorListing notu).
      initiatorListing: {
        include: {
          product: { include: { brand: true, model: true } },
          userProduct: { select: { usageAmount: true, usageUnit: true } },
        },
      },
      initiator: { select: { id: true, displayName: true, avatarUrl: true } },
      interestLostByUser: { select: { id: true, displayName: true } },
      messages: { orderBy: { createdAt: "asc" }, include: { sender: { select: { id: true, displayName: true } } } },
    },
  });

  if (!thread || (thread.initiatorId !== userId && thread.tradeListing.userId !== userId)) {
    notFound();
  }

  // "── Yeni ──" ayıracı için: okundu işaretlemeden ÖNCE ilk okunmamış (karşı
  // taraftan gelen) mesajı yakala.
  const firstUnreadId =
    thread.messages.find((m) => m.senderId !== userId && !m.isRead)?.id ?? null;

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

  const statusChip = isBlocked
    ? { label: "Sonlandırıldı", cls: "bg-red-50 text-red-600" }
    : isListingClosed
      ? { label: "Kapandı", cls: "bg-gray-100 text-gray-500" }
      : { label: "Aktif", cls: "bg-green-50 text-green-700" };

  const disabledNote = isBlocked
    ? "Bu görüşme sonlandırıldı."
    : isListingClosed
      ? "Bu ilan artık takasa açık değil, mesaj gönderemezsiniz."
      : !isTradeMessagingEnabled()
        ? "Mesajlaşma özelliği geçici olarak kapalı."
        : "";

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
    <div
      className="max-w-2xl w-full mx-auto flex flex-col"
      style={{ height: "calc(100dvh - 3.5rem)" }}
    >
      {/* ── Başlık ── */}
      <div className="shrink-0 border-b border-gray-100">
        <div className="px-4 pt-3">
          <Link href="/mesajlar" className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Mesajlarım
          </Link>
        </div>
        <div className="px-4 py-2.5 flex items-center gap-3">
          <Avatar
            displayName={counterpart?.displayName ?? null}
            avatarUrl={counterpart?.avatarUrl}
            seed={String(counterpart?.id ?? "")}
            size={36}
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-gray-900 truncate">
                {counterpart?.displayName ?? "Kullanıcı"}
              </span>
              <span className={`shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusChip.cls}`}>
                {statusChip.label}
              </span>
            </div>
            <div className="text-xs text-gray-400 truncate">
              {vehicleName} · {thread.tradeListing.city} ·{" "}
              <Link href={`/takas/${thread.tradeListing.id}`} className="text-link hover:underline">
                İlanı gör →
              </Link>
            </div>
          </div>
          <ThreadActions threadId={thread.id} showInterestLost={thread.interestLostByUserId == null} />
        </div>
      </div>

      {/* Karşı tarafın teklif ettiği araç — sadece alıcı (ilan sahibi) için
          anlamlı; kendi ilanını zaten başlıkta görüyor. */}
      {!isInitiator && (
        <div className="shrink-0 px-4 py-2 bg-link-soft/60 border-b border-link-line">
          <p className="text-[11px] font-bold text-link-deep">
            {counterpart?.displayName ?? "Kullanıcı"} — teklif ettiği araç
          </p>
          {thread.initiatorListing ? (
            thread.initiatorListing.isActive ? (
              <Link
                href={`/takas/${thread.initiatorListing.id}`}
                className="text-sm font-semibold text-link-deep hover:underline"
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
        <p className="shrink-0 px-4 py-2 text-xs text-center text-gray-400 bg-gray-50 border-b border-gray-100">
          Bu görüşmeyle ilgini kaybettiğini belirttin.
        </p>
      )}
      {interestLostByOther && (
        <p className="shrink-0 px-4 py-2 text-xs text-center text-gray-400 bg-gray-50 border-b border-gray-100">
          {counterpart?.displayName ?? "Diğer taraf"} bu görüşmeyle ilgisini kaybettiğini belirtti.
        </p>
      )}

      {/* ── Mesajlar + giriş alanı (kendi içinde scroll) ── */}
      <MessageThread
        threadId={thread.id}
        currentUserId={userId}
        firstUnreadId={firstUnreadId}
        canMessage={canMessage}
        disabledNote={disabledNote}
        initialMessages={thread.messages.map((m) => ({
          id: m.id,
          text: m.text,
          senderId: m.senderId,
          createdAt: m.createdAt.toISOString(),
          isRead: m.isRead,
        }))}
        footer={
          canRate && !existingRating ? (
            <TradeRatingForm threadId={thread.id} counterpartName={counterpart?.displayName ?? "Kullanıcı"} />
          ) : null
        }
      />
    </div>
  );
}
