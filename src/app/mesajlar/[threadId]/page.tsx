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
import { ReopenButton } from "./ReopenButton";
import { TradeRatingForm } from "./TradeRatingForm";

export const metadata: Metadata = { title: "Görüşme", robots: { index: false } };

type SideListing = {
  id: number;
  isActive: boolean;
  product: { brand: { name: string }; model: { name: string }; year: number | null };
  userProduct?: { usageAmount: number | null; usageUnit: string | null } | null;
} | null;

function SideRow({ label, listing }: { label: string; listing: SideListing }) {
  return (
    <div>
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide leading-tight">{label}</p>
      {listing ? (
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="text-sm font-semibold text-gray-900">
            {listing.product.brand.name} {stripModelGenRange(listing.product.model.name)}
            {listing.product.year ? ` ${listing.product.year}` : ""}
            {listing.userProduct?.usageUnit === "km" && listing.userProduct.usageAmount != null
              ? ` · ${listing.userProduct.usageAmount.toLocaleString("tr-TR")} km`
              : ""}
          </span>
          {listing.isActive ? (
            <Link href={`/takas/${listing.id}`} className="text-xs text-link hover:underline">
              İlanı aç →
            </Link>
          ) : (
            <span className="text-xs text-gray-300">ilan kapandı</span>
          )}
        </div>
      ) : (
        <p className="text-sm text-gray-400">Araç belirtilmedi</p>
      )}
    </div>
  );
}

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
          userProduct: { select: { usageAmount: true, usageUnit: true } },
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

  const isBlocked = thread.blockedByUserId != null;
  const blockedByMe = thread.blockedByUserId === userId;
  const isClosed = thread.closedByUserId != null;   // soft "kapat" VEYA engel
  const closedByMe = thread.closedByUserId === userId;
  const isListingClosed = !thread.tradeListing.isActive;
  const canMessage = !isClosed && !isListingClosed && isTradeMessagingEnabled();
  const isInitiator = userId === thread.initiatorId;
  const counterpart = isInitiator ? thread.tradeListing.user : thread.initiator;
  const counterpartName = counterpart?.displayName ?? "Kullanıcı";
  const counterpartId = isInitiator ? thread.tradeListing.userId : thread.initiatorId;
  const interestLostByMe = thread.interestLostByUserId === userId;
  const interestLostByOther = thread.interestLostByUserId != null && !interestLostByMe;

  // Eskalasyon uyarısı — bu kişiyle kaç görüşme kapattım (engelli olanlar hariç,
  // engel zaten sert çözüm).
  const closedByMeCount = isBlocked
    ? 0
    : await prisma.messageThread.count({
        where: {
          closedByUserId: userId,
          blockedByUserId: null,
          OR: [
            { initiatorId: counterpartId, tradeListing: { userId } },
            { initiatorId: userId, tradeListing: { userId: counterpartId } },
          ],
        },
      });

  // Takas görüşmesinde iki araç var: benim tarafım + karşı tarafın aracı.
  // Rol'e göre eşleşir — ilan sahibiysem ilanım tradeListing, karşı tarafın
  // teklifi initiatorListing; mesajı ben başlattıysam tersi. Karşı taraf hiç
  // ilan seçmemiş olabilir (initiatorListing null).
  const mySide   = isInitiator ? thread.initiatorListing : thread.tradeListing;
  const theirSide = isInitiator ? thread.tradeListing : thread.initiatorListing;

  // Engellendi rozetini SADECE engelleyen görür — karşı taraf sadece "Kapatıldı"
  // görür (engellendiği bilgisi verilmez).
  const statusChip = isBlocked && blockedByMe
    ? { label: "Engellendi", cls: "bg-red-50 text-red-600" }
    : isClosed
      ? { label: "Kapatıldı", cls: "bg-gray-100 text-gray-500" }
      : isListingClosed
        ? { label: "İlan kapandı", cls: "bg-gray-100 text-gray-500" }
        : { label: "Aktif", cls: "bg-green-50 text-green-700" };

  // Görüşme donmuşsa giriş alanı yerine açıklayıcı kart (kim, ne, sonra ne).
  let stateCard: React.ReactNode = null;
  if (isBlocked && blockedByMe) {
    stateCard = (
      <div className="p-4 text-center space-y-1">
        <p className="text-xs text-gray-500">Bu kullanıcıyı engelledin.</p>
        <p className="text-[11px] text-gray-400">
          Engeli <Link href="/profil#engellenenler" className="text-link hover:underline">Profil › Engellenen kullanıcılar</Link>&apos;dan kaldırabilirsin.
        </p>
      </div>
    );
  } else if (isBlocked && !blockedByMe) {
    stateCard = <p className="p-4 text-xs text-gray-400 text-center">Bu görüşme kapatıldı.</p>;
  } else if (isClosed && closedByMe) {
    stateCard = (
      <div className="p-4 text-center space-y-2">
        <p className="text-xs text-gray-500">Bu görüşmeyi kapattın.</p>
        <ReopenButton threadId={thread.id} />
      </div>
    );
  } else if (isClosed && !closedByMe) {
    stateCard = (
      <p className="p-4 text-xs text-gray-400 text-center">
        {counterpartName} bu görüşmeyi kapattı.
      </p>
    );
  } else if (isListingClosed) {
    stateCard = <p className="p-4 text-xs text-gray-400 text-center">Bu ilan artık takasa açık değil, mesaj gönderemezsiniz.</p>;
  } else if (!isTradeMessagingEnabled()) {
    stateCard = <p className="p-4 text-xs text-gray-400 text-center">Mesajlaşma özelliği geçici olarak kapalı.</p>;
  }

  // Takas sonrası karşılıklı değerlendirme daveti — ilan "Takas oldu" ile
  // kapandıysa ve bu kullanıcı bu görüşmeyi henüz değerlendirmediyse gösterilir.
  // Görüşme birden fazla ilanı kapsayabilir — ilanlardan herhangi biri "Takas
  // oldu" ile kapandıysa ve iki taraf da yazışmışsa davet gösterilir.
  const canRate =
    (thread.tradeListing.closeReason === "TRADED" ||
      thread.initiatorListing?.closeReason === "TRADED") &&
    thread.hasReciprocalReply;
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
      {/* ── Başlık — sadece kiminle konuştuğun ── */}
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
          <div className="flex-1 min-w-0 flex items-center gap-2">
            <span className="text-sm font-bold text-gray-900 truncate">{counterpartName}</span>
            <span className={`shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusChip.cls}`}>
              {statusChip.label}
            </span>
          </div>
          <ThreadActions
            threadId={thread.id}
            interestLostByMe={interestLostByMe}
            isClosed={isClosed}
            blockedByMe={blockedByMe}
            closedByMeCount={closedByMeCount}
          />
        </div>
      </div>

      {/* ── Bu görüşmedeki takas — iki araç, kimin olduğu açıkça yazılı ── */}
      <div className="shrink-0 px-4 py-3 bg-gray-50/70 border-b border-gray-100">
        <p className="text-[11px] font-bold text-gray-500 mb-2">Bu görüşmedeki takas</p>
        <div className="space-y-1.5">
          <SideRow label="Senin aracın" listing={mySide} />
          <div className="flex items-center gap-2 text-gray-300 pl-1">
            <span className="h-px w-4 bg-gray-200" />
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M7 8h13l-3-3M17 16H4l3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="h-px flex-1 bg-gray-200" />
          </div>
          <SideRow label={`${counterpartName} — aracı`} listing={theirSide} />
        </div>
      </div>

      {interestLostByMe && (
        <p className="shrink-0 px-4 py-2 text-xs text-center text-gray-400 bg-gray-50 border-b border-gray-100">
          Bu takasla ilgilenmediğini belirttin — görüşme açık. Geri almak için: ⋯
        </p>
      )}
      {interestLostByOther && (
        <p className="shrink-0 px-4 py-2 text-xs text-center text-gray-400 bg-gray-50 border-b border-gray-100">
          {counterpartName} bu takasla ilgilenmediğini belirtti — görüşme hâlâ açık.
        </p>
      )}

      {/* ── Mesajlar + giriş alanı (kendi içinde scroll) ── */}
      <MessageThread
        threadId={thread.id}
        currentUserId={userId}
        firstUnreadId={firstUnreadId}
        canMessage={canMessage}
        stateCard={stateCard}
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
