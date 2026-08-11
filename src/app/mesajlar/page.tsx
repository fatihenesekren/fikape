import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { stripModelGenRange } from "@/lib/modelDisplay";

export const metadata: Metadata = { title: "Mesajlarım", robots: { index: false } };

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
          user: { select: { id: true, displayName: true } },
        },
      },
      initiator: { select: { id: true, displayName: true } },
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
      // Karşı taraftan gelen, henüz okunmamış mesaj sayısı — Message.isRead alanı
      // zaten thread açılınca güncelleniyordu, sadece liste sorgusuna hiç dahil
      // edilmemişti (bkz. denetim raporu).
      _count: { select: { messages: { where: { isRead: false, senderId: { not: userId } } } } },
    },
    orderBy: { lastMessageAt: "desc" },
    take: 50,
  }).catch(() => []);

  return (
    <div className="max-w-2xl w-full mx-auto px-4 py-10">
      <h1 className="text-2xl font-black text-gray-900 mb-6">Mesajlarım</h1>

      {threads.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-gray-100 rounded-2xl p-10 text-center text-gray-400 text-sm">
          Henüz bir görüşmeniz yok.
        </div>
      ) : (
        <div className="space-y-3">
          {threads.map((t) => {
            const isInitiator = t.initiatorId === userId;
            const counterpart = isInitiator ? t.tradeListing.user : t.initiator;
            const vehicleName = `${t.tradeListing.product.brand.name} ${stripModelGenRange(t.tradeListing.product.model.name)}`;
            const lastMessage = t.messages[0];
            const unreadCount = t._count.messages;
            return (
              <Link
                key={t.id}
                href={`/mesajlar/${t.id}`}
                className="block bg-white border border-gray-100 rounded-2xl p-4 hover:border-gray-200 transition-colors"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className={`text-sm ${unreadCount > 0 ? "font-bold text-gray-900" : "font-semibold text-gray-900"}`}>
                    {counterpart?.displayName ?? "Kullanıcı"} — {vehicleName}
                  </p>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {unreadCount > 0 && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white" style={{ background: "#4338ca" }}>
                        {unreadCount}
                      </span>
                    )}
                    {!t.tradeListing.isActive && (
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-400">Kapandı</span>
                    )}
                  </div>
                </div>
                {lastMessage && (
                  <p className={`text-xs mt-1 truncate ${unreadCount > 0 ? "text-gray-600" : "text-gray-400"}`}>{lastMessage.text}</p>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
