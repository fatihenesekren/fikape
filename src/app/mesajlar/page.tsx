import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Avatar } from "@/components/Avatar";
import { BackLink } from "@/components/BackLink";
import { stripModelGenRange } from "@/lib/modelDisplay";
import { listTimeLabel } from "@/lib/messageTime";

export const metadata: Metadata = { title: "Mesajlarım", robots: { index: false } };

type ProdRef = { brand: { name: string }; model: { name: string } } | null | undefined;
function carLabel(p: ProdRef): string | null {
  return p ? `${p.brand.name} ${stripModelGenRange(p.model.name)}` : null;
}

function UnreadBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="shrink-0 min-w-[18px] h-[18px] px-1 rounded-full text-white text-[10px] font-bold flex items-center justify-center" style={{ background: "var(--link-deep)" }}>
      {count > 9 ? "9+" : count}
    </span>
  );
}

export default async function MesajlarPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/giris");

  const userId = Number(session.user.id);
  const { tab } = await searchParams;

  // "Usta Mesajlarım" sekmesi yalnız iki durumda görünür: kullanıcı aktif bir
  // usta ise, VEYA (aktif usta olmasa bile) bir ustayla danışan olarak en az
  // bir konuşma geçmişi varsa — böylece mesajına kimse erişimini kaybetmez
  // (bkz. feature_usta_gorusleri_ilerleme / mesaj hub birleştirme kararı).
  const [expertProfile, ustaThreadCount] = await Promise.all([
    prisma.expertProfile.findUnique({ where: { userId }, select: { status: true, slug: true } }),
    prisma.expertMessageThread.count({
      where: { OR: [{ initiatorId: userId }, { expertProfile: { userId } }] },
    }),
  ]);
  const showUstaTab = expertProfile?.status === "ACTIVE" || ustaThreadCount > 0;
  const activeTab: "takas" | "usta" = showUstaTab && tab === "usta" ? "usta" : "takas";

  const takasThreads = await prisma.messageThread.findMany({
    where: {
      OR: [{ initiatorId: userId }, { tradeListing: { userId } }],
    },
    include: {
      tradeListing: {
        include: {
          product: { include: { brand: true, model: true } },
          user: { select: { id: true, displayName: true, avatarUrl: true } },
        },
      },
      initiatorListing: {
        include: { product: { include: { brand: true, model: true } } },
      },
      initiator: { select: { id: true, displayName: true, avatarUrl: true } },
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
      _count: { select: { messages: { where: { isRead: false, senderId: { not: userId } } } } },
    },
    orderBy: { lastMessageAt: "desc" },
    take: 50,
  }).catch(() => []);

  const ustaThreads = showUstaTab
    ? await prisma.expertMessageThread.findMany({
        where: { OR: [{ initiatorId: userId }, { expertProfile: { userId } }] },
        select: {
          id: true,
          lastMessageAt: true,
          initiator: { select: { id: true, displayName: true, avatarUrl: true } },
          expertProfile: { select: { headline: true, userId: true, user: { select: { id: true, displayName: true, avatarUrl: true } } } },
          messages: { orderBy: { createdAt: "desc" }, take: 1, select: { text: true, senderId: true, isRead: true } },
          // Takas listesiyle aynı sayaç deseni — önceden yalnız "okunmamışı
          // var mı?" (boole) tutuluyordu, bu yüzden satırda rakamlı rozet
          // yerine düz bir mavi nokta gösteriliyordu (görsel tutarsızlık,
          // kullanıcı fark etti).
          _count: { select: { messages: { where: { isRead: false, senderId: { not: userId } } } } },
        },
        orderBy: { lastMessageAt: "desc" },
      })
    : [];

  const takasUnread = takasThreads.reduce((sum, t) => sum + t._count.messages, 0);
  const ustaUnread = ustaThreads.reduce((sum, t) => sum + t._count.messages, 0);

  const now = new Date();

  const takasList =
    takasThreads.length === 0 ? (
      <div className="bg-white border-2 border-dashed border-gray-100 rounded-2xl p-12 text-center">
        <div className="w-11 h-11 mx-auto rounded-full bg-link-soft text-link flex items-center justify-center mb-3">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M21 11.5a8.5 8.5 0 0 1-11.9 7.8L3 21l1.7-6.1A8.5 8.5 0 1 1 21 11.5Z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <p className="font-semibold text-gray-800 text-sm">Henüz bir görüşmen yok</p>
        <p className="text-sm text-gray-400 mt-1">
          <Link href="/takas" className="text-link hover:underline">Takas Pazarı</Link>&apos;ndan ilgilendiğin bir ilana mesaj atarak başlayabilirsin.
        </p>
      </div>
    ) : (
      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden divide-y divide-gray-50">
        {takasThreads.map((t) => {
          const isInitiator = t.initiatorId === userId;
          const counterpart = isInitiator ? t.tradeListing.user : t.initiator;
          const myCar = carLabel(isInitiator ? t.initiatorListing?.product : t.tradeListing.product);
          const theirCar = carLabel(isInitiator ? t.tradeListing.product : t.initiatorListing?.product);
          const lastMessage = t.messages[0];
          const unreadCount = t._count.messages;
          const when = t.lastMessageAt ?? lastMessage?.createdAt ?? t.createdAt;

          return (
            <Link
              key={t.id}
              href={`/mesajlar/${t.id}`}
              className="flex gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors"
            >
              <Avatar
                displayName={counterpart?.displayName ?? null}
                avatarUrl={counterpart?.avatarUrl}
                seed={String(counterpart?.id ?? "")}
                size={40}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`text-sm truncate ${unreadCount > 0 ? "font-bold text-gray-900" : "font-semibold text-gray-800"}`}>
                    {counterpart?.displayName ?? "Kullanıcı"}
                  </span>
                  {!t.tradeListing.isActive && (
                    <span className="shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-400">Kapandı</span>
                  )}
                  <span className="ml-auto shrink-0 text-[11px] text-gray-400">{listTimeLabel(new Date(when), now)}</span>
                </div>
                <p className="text-[11px] text-gray-400 truncate mt-0.5">
                  <span className="text-gray-500">{myCar ?? "Aracın"}</span>
                  <span className="mx-1">⇄</span>
                  <span className="text-gray-500">{theirCar ?? "araç belirtilmedi"}</span>
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <p className={`flex-1 text-xs truncate ${unreadCount > 0 ? "text-gray-700 font-medium" : "text-gray-400"}`}>
                    {lastMessage
                      ? `${lastMessage.senderId === userId ? "Sen: " : ""}${lastMessage.text}`
                      : "Henüz mesaj yok"}
                  </p>
                  <UnreadBadge count={unreadCount} />
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    );

  const isActiveExpert = expertProfile?.status === "ACTIVE";

  const ustaList =
    ustaThreads.length === 0 ? (
      <div className="bg-white border-2 border-dashed border-gray-100 rounded-2xl p-12 text-center">
        <p className="font-semibold text-gray-800 text-sm">
          {/* Aynı boş durum iki farklı okuyucuya hitap ediyor: aktif usta
              "danışan mi bekliyorum" merak ederken, sıradan kullanıcı
              "bir ustaya nasıl ulaşırım" derdinde — tek metin ikisine de
              uymuyordu (kullanıcı fark etti). */}
          {isActiveExpert ? "Henüz bir danışan mesajınız yok" : "Henüz bir usta ile mesajlaşman yok"}
        </p>
        {isActiveExpert && expertProfile?.slug && (
          <p className="text-sm text-gray-400 mt-1">
            Bir kullanıcı <Link href={`/usta/${expertProfile.slug}`} className="text-link hover:underline">profilinizden</Link> size mesaj gönderdiğinde burada görünecek.
          </p>
        )}
      </div>
    ) : (
      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden divide-y divide-gray-50">
        {/* Takas Mesajlarım satırıyla BİREBİR aynı yapı — önceden avatar
            dikey ortalanıyordu (items-center), tarih hiç yoktu, son mesaj
            satırı farklı bir font boyutu/rengi (text-sm/text-gray-500)
            kullanıyordu ve okunmamış göstergesi rakamsız düz bir nokta
            idi. Kullanıcı iki listenin görünümünün tutarsız olduğunu
            fark etti; artık ikisi de aynı bileşenlerle aynı satırı üretiyor. */}
        {ustaThreads.map((t) => {
          const isUsta = t.expertProfile.userId === userId;
          const counterpart = isUsta ? t.initiator : t.expertProfile.user;
          const counterpartName = counterpart.displayName ?? (isUsta ? "Kullanıcı" : "Usta");
          const last = t.messages[0];
          const unreadCount = t._count.messages;
          return (
            <Link
              key={t.id}
              href={`/usta-mesajlarim/${t.id}`}
              className="flex gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors"
            >
              <Avatar
                displayName={counterpart.displayName}
                avatarUrl={counterpart.avatarUrl}
                seed={String(counterpart.id)}
                size={40}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`text-sm truncate ${unreadCount > 0 ? "font-bold text-gray-900" : "font-semibold text-gray-800"}`}>
                    {counterpartName}
                  </span>
                  <span className="ml-auto shrink-0 text-[11px] text-gray-400">{listTimeLabel(t.lastMessageAt, now)}</span>
                </div>
                {t.expertProfile.headline && (
                  <p className="text-[11px] text-gray-400 truncate mt-0.5">{t.expertProfile.headline}</p>
                )}
                <div className="flex items-center gap-2 mt-1">
                  <p className={`flex-1 text-xs truncate ${unreadCount > 0 ? "text-gray-700 font-medium" : "text-gray-400"}`}>
                    {last ? `${last.senderId === userId ? "Sen: " : ""}${last.text}` : "Henüz mesaj yok"}
                  </p>
                  <UnreadBadge count={unreadCount} />
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    );

  return (
    <div className="max-w-2xl w-full mx-auto px-4 py-8">
      {/* Sayfaya anasayfadan, bir bildirimden ya da başka bir yerden gelinmiş
          olabilir — sabit "Profilime dön" herkesi aynı yere gönderirdi
          (kullanıcı fark etti). BackLink tarayıcı geçmişi varsa oraya döner,
          yoksa (doğrudan link/yeni sekme) /profil'e düşer. */}
      <div className="mb-4">
        <BackLink fallbackHref="/profil" label="← Geri dön" />
      </div>
      <h1 className="text-2xl font-black text-gray-900 mb-1">Mesajlarım</h1>

      {!showUstaTab ? (
        <>
          <p className="text-sm text-gray-400 mb-6">Takas ilanların üzerinden başlayan görüşmeler.</p>
          <div className="bg-gray-50 border border-gray-100 rounded-2xl p-3">
            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wide px-1 mb-2">Takas Mesajlarım</h2>
            {takasList}
          </div>
        </>
      ) : (
        <>
          {/* "Takas ve usta görüşmelerin tek yerde." → 1 ajanlı metin
              denetimiyle "ilanların/danışmaların" diline çevrilmişti ama
              kullanıcı bunun aşağıdaki sekme adlarından (Takas Mesajlarım/
              Usta Mesajlarım) kopuk kaldığını belirtti; kendi taslağına
              göre yeniden yazıldı — sekmelere doğrudan gönderme yapıyor. */}
          <p className="text-sm text-gray-400 mb-5">Takas ve Usta mesajlarına aşağıdaki sekmelerden ulaşabilirsin.</p>
          <div className="flex gap-2 mb-5">
            <Link
              href="/mesajlar"
              className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-semibold border transition-colors flex items-center gap-1.5 ${
                activeTab === "takas"
                  ? "border-[var(--btn-dark)] bg-[var(--btn-dark)] text-white"
                  : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50"
              }`}
            >
              Takas Mesajlarım
              {activeTab !== "takas" && <UnreadBadge count={takasUnread} />}
            </Link>
            <Link
              href="/mesajlar?tab=usta"
              className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-semibold border transition-colors flex items-center gap-1.5 ${
                activeTab === "usta"
                  ? "border-[var(--btn-dark)] bg-[var(--btn-dark)] text-white"
                  : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50"
              }`}
            >
              Usta Mesajlarım
              {activeTab !== "usta" && <UnreadBadge count={ustaUnread} />}
            </Link>
          </div>
          {activeTab === "takas" ? takasList : ustaList}
        </>
      )}
    </div>
  );
}
