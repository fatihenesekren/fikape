import { prisma } from "@/lib/prisma";
import { finalizeExpiredAppeals } from "@/lib/expertAppeal";
import { ExpertAppealActions } from "./ExpertAppealActions";

export const metadata = { title: "Usta İtirazları — fikape admin" };

// Modül seviyesinde ayrı fonksiyon — Date.now() doğrudan render içinde
// çağrılırsa react-hooks/purity kuralına takılıyor (bkz. lib/timeAgo.ts deseni).
function isDueSoon(dueAt: Date): boolean {
  return dueAt.getTime() - Date.now() < 3 * 24 * 60 * 60 * 1000;
}

export default async function ExpertAppealsPage() {
  await finalizeExpiredAppeals();

  const appeals = await prisma.expertAppeal.findMany({
    where: { status: "PENDING" },
    select: {
      id: true, subjectType: true, period: true, reason: true, createdAt: true, reviewDueAt: true,
      profile: { select: { headline: true, user: { select: { displayName: true, email: true } } } },
      note: { select: { title: true, rejectionReason: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="px-4 sm:px-8 py-10 max-w-3xl space-y-6">
      <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
        Usta İtirazları
        {appeals.length > 0 && (
          <span className="px-2 py-0.5 rounded-full text-sm font-bold bg-orange-100 text-orange-700">
            {appeals.length} bekliyor
          </span>
        )}
      </h1>
      <p className="text-sm text-gray-400 -mt-4">
        14 gün içinde karara bağlanmayan itirazlar otomatik olarak kesinleşir (orijinal karar kalır).
      </p>

      {appeals.length === 0 ? (
        <p className="text-sm text-gray-400">Bekleyen itiraz yok.</p>
      ) : (
        <div className="space-y-3">
          {appeals.map((a) => {
            const dueSoon = isDueSoon(a.reviewDueAt);
            return (
              <div key={a.id} className="bg-white border border-gray-100 rounded-xl p-4 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-sm min-w-0">
                    <span className="font-semibold text-gray-800">
                      {a.profile.headline ?? a.profile.user.displayName ?? a.profile.user.email}
                    </span>
                    <span className="text-gray-400"> · {a.subjectType === "NOTE_REJECTION" ? "Not reddi" : `Görünürlük (${a.period})`}</span>
                  </div>
                  <span className={`text-[11px] shrink-0 ${dueSoon ? "text-red-600 font-semibold" : "text-gray-400"}`}>
                    Son inceleme: {a.reviewDueAt.toLocaleDateString("tr-TR")}
                  </span>
                </div>
                {a.note && (
                  <p className="text-xs text-gray-500">
                    Not: &quot;{a.note.title}&quot; — ret gerekçesi: {a.note.rejectionReason ?? "belirtilmemiş"}
                  </p>
                )}
                <p className="text-sm text-gray-800 bg-gray-50 rounded-lg px-3 py-2">{a.reason}</p>
                <div className="pt-1 border-t border-gray-50">
                  <ExpertAppealActions appealId={a.id} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
