import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Avatar } from "@/components/Avatar";
import { stripModelGenRange } from "@/lib/modelDisplay";
import { listTimeLabel } from "@/lib/messageTime";

export const metadata: Metadata = { title: "Mesajlarım", robots: { index: false } };

type ProdRef = { brand: { name: string }; model: { name: string } } | null | undefined;
function carLabel(p: ProdRef): string | null {
  return p ? `${p.brand.name} ${stripModelGenRange(p.model.name)}` : null;
}

export default async function MesajlarPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/giris");

  const userId = Number(session.user.id);

  const threads = await prisma.messageThread.findMany({
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

  const now = new Date();

  return (
    <div className="max-w-2xl w-full mx-auto px-4 py-8">
      <h1 className="text-2xl font-black text-gray-900 mb-1">Mesajlarım</h1>
      <p className="text-sm text-gray-400 mb-6">Takas ilanların üzerinden başlayan görüşmeler.</p>

      {threads.length === 0 ? (
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
          {threads.map((t) => {
            const isInitiator = t.initiatorId === userId;
            const counterpart = isInitiator ? t.tradeListing.user : t.initiator;
            const myCar    = carLabel(isInitiator ? t.initiatorListing?.product : t.tradeListing.product);
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
                    {unreadCount > 0 && (
                      <span className="shrink-0 min-w-[18px] h-[18px] px-1 rounded-full text-white text-[10px] font-bold flex items-center justify-center" style={{ background: "#0C447C" }}>
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
