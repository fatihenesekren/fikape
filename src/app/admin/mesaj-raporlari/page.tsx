import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { BanButton, UnbanButton } from "./ReportActions";

export const metadata: Metadata = { title: "Mesaj Raporları — Admin" };

const REASON_LABEL: Record<string, string> = {
  SPAM: "İstenmeyen içerik",
  SCAM_ATTEMPT: "Dolandırıcılık şüphesi",
  OFFENSIVE: "Uygunsuz/hakaret içeriyor",
  OTHER: "Diğer",
};

export default async function MesajRaporlariPage() {
  const [reports, bannedUsers, activeListingCount, tradedCount, threadCount, reciprocalThreadCount] = await Promise.all([
    prisma.messageReport.findMany({
      where: { status: "PENDING" },
      include: { message: { select: { text: true, senderId: true, threadId: true } }, reporter: { select: { displayName: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.findMany({
      where: { isBanned: true },
      select: { id: true, displayName: true, email: true, banReason: true },
      orderBy: { bannedAt: "desc" },
      take: 50,
    }),
    prisma.tradeListing.count({ where: { isActive: true } }),
    prisma.tradeListing.count({ where: { closeReason: "TRADED" } }),
    prisma.messageThread.count(),
    prisma.messageThread.count({ where: { hasReciprocalReply: true } }),
  ]);

  const reciprocalRatio = threadCount > 0 ? Math.round((reciprocalThreadCount / threadCount) * 100) : 0;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      <h1 className="text-xl font-bold text-gray-900">Mesaj Raporları</h1>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white border border-gray-100 rounded-xl p-4 text-center">
          <p className="text-2xl font-black text-gray-900">{activeListingCount}</p>
          <p className="text-xs text-gray-400">Aktif ilan</p>
        </div>
        <div className="bg-white border border-gray-100 rounded-xl p-4 text-center">
          <p className="text-2xl font-black text-gray-900">{tradedCount}</p>
          <p className="text-xs text-gray-400">Takas oldu</p>
        </div>
        <div className="bg-white border border-gray-100 rounded-xl p-4 text-center">
          <p className="text-2xl font-black text-gray-900">%{reciprocalRatio}</p>
          <p className="text-xs text-gray-400">Karşılıklı yazışma oranı</p>
        </div>
      </div>

      <div>
        <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Bekleyen Raporlar</h2>
        {reports.length === 0 ? (
          <p className="text-sm text-gray-400">Bekleyen rapor yok.</p>
        ) : (
          <div className="space-y-2">
            {reports.map((r) => (
              <div key={r.id} className="bg-white border border-gray-100 rounded-xl p-4">
                <p className="text-xs text-gray-400">
                  {r.reporter.displayName ?? "Kullanıcı"} tarafından raporlandı — {REASON_LABEL[r.reason] ?? r.reason}
                </p>
                <p className="text-sm text-gray-800 mt-1">&quot;{r.message.text}&quot;</p>
                <div className="flex items-center gap-3 mt-2">
                  <a href={`/mesajlar/${r.message.threadId}`} className="text-xs text-gray-400 hover:underline">
                    Görüşmeyi görüntüle →
                  </a>
                  <BanButton reportId={r.id} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Banlı Kullanıcılar</h2>
        {bannedUsers.length === 0 ? (
          <p className="text-sm text-gray-400">Banlı kullanıcı yok.</p>
        ) : (
          <div className="space-y-2">
            {bannedUsers.map((u) => (
              <div key={u.id} className="bg-white border border-gray-100 rounded-xl p-3 flex items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-gray-800">{u.displayName ?? u.email}</p>
                  <p className="text-xs text-gray-400">{u.banReason}</p>
                </div>
                <UnbanButton userId={u.id} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
