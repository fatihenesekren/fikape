import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Usta Mesajlarım — fikape", robots: { index: false } };

export default async function ExpertMessagesInboxPage() {
  const session = await auth();
  if (!session) redirect("/giris?callbackUrl=/usta-mesajlarim");
  const userId = parseInt(session.user.id);

  const threads = await prisma.expertMessageThread.findMany({
    where: { OR: [{ initiatorId: userId }, { expertProfile: { userId } }] },
    select: {
      id: true, lastMessageAt: true,
      initiator: { select: { displayName: true } },
      expertProfile: {
        select: { headline: true, userId: true, user: { select: { displayName: true } } },
      },
      messages: { orderBy: { createdAt: "desc" }, take: 1, select: { text: true, senderId: true, isRead: true } },
    },
    orderBy: { lastMessageAt: "desc" },
  });

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-black text-gray-900 mb-6">Usta Mesajlarım</h1>

      {threads.length === 0 ? (
        <p className="text-sm text-gray-400">Henüz bir usta ile mesajlaşmanız yok.</p>
      ) : (
        <div className="space-y-2">
          {threads.map((t) => {
            const isUsta = t.expertProfile.userId === userId;
            const counterpartName = isUsta
              ? (t.initiator.displayName ?? "Kullanıcı")
              : (t.expertProfile.user.displayName ?? "Usta");
            const last = t.messages[0];
            const hasUnread = !!last && last.senderId !== userId && !last.isRead;
            return (
              <Link
                key={t.id}
                href={`/usta-mesajlarim/${t.id}`}
                className="block bg-white border border-gray-100 rounded-xl p-4 hover:border-gray-300 transition-colors"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-gray-800">{counterpartName}</span>
                  {hasUnread && <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />}
                </div>
                {t.expertProfile.headline && <p className="text-xs text-gray-400">{t.expertProfile.headline}</p>}
                {last && <p className="text-sm text-gray-500 truncate mt-1">{last.text}</p>}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
