import { prisma } from "@/lib/prisma";
import type { ExpertStatus } from "@/generated/prisma/client";
import { ExpertApplicationActions } from "./ExpertApplicationActions";
import { EXPERT_MONTHLY_QUOTA_DEFAULT } from "@/lib/expertApplication";

export const metadata = { title: "Usta Başvuruları — fikape admin" };

export default async function ExpertApplicationsPage() {
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const [applications, approvedThisMonth] = await Promise.all([
    prisma.expertProfile.findMany({
      where: { status: { in: ["PENDING_VERIFICATION", "WAITLISTED"] } },
      select: {
        id: true, status: true, headline: true, expertiseTags: true, city: true, district: true, bio: true, createdAt: true,
        user: { select: { displayName: true, email: true, trustLevel: true } },
      },
      orderBy: [{ status: "asc" }, { createdAt: "asc" }],
    }),
    prisma.expertProfile.count({ where: { verifiedAt: { gte: monthStart } } }).catch(() => 0),
  ]);

  const pending = applications.filter((a) => a.status === "PENDING_VERIFICATION");
  const waitlisted = applications.filter((a) => a.status === "WAITLISTED");

  return (
    <div className="px-4 sm:px-8 py-10 max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
          Usta Başvuruları
          {pending.length > 0 && (
            <span className="px-2 py-0.5 rounded-full text-sm font-bold bg-orange-100 text-orange-700">
              {pending.length} bekliyor
            </span>
          )}
        </h1>
        <p className="text-sm text-gray-400 mt-1">
          Bu ay onaylanan: {approvedThisMonth} / {EXPERT_MONTHLY_QUOTA_DEFAULT} (gösterge amaçlı — sert kota henüz otomatik değil).
        </p>
        <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2 mt-2 leading-relaxed">
          ⚠️ Onaydan önce mesleki geçmiş belgesini (vergi levhası, oda kaydı, ustalık belgesi)
          e-posta yoluyla talep edip kontrol edin — belge yükleme sistemi henüz kodda yok.
        </p>
      </div>

      {pending.length === 0 && waitlisted.length === 0 ? (
        <p className="text-sm text-gray-400">Bekleyen usta başvurusu yok.</p>
      ) : (
        <>
          {pending.length > 0 && (
            <section className="space-y-3">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">İncelemede</p>
              {pending.map((a) => (
                <ApplicationCard key={a.id} app={a} />
              ))}
            </section>
          )}
          {waitlisted.length > 0 && (
            <section className="space-y-3">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">
                Bekleme Listesi <span className="font-normal normal-case">(başvuru penceresi kapalıyken gelen)</span>
              </p>
              {waitlisted.map((a) => (
                <ApplicationCard key={a.id} app={a} />
              ))}
            </section>
          )}
        </>
      )}
    </div>
  );
}

function ApplicationCard({
  app,
}: {
  app: {
    id: number; status: ExpertStatus; headline: string | null;
    expertiseTags: string[]; city: string | null; district: string | null; bio: string | null;
    createdAt: Date; user: { displayName: string | null; email: string; trustLevel: number };
  };
}) {
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4 space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-sm min-w-0">
          <span className="font-semibold text-gray-800">{app.headline}</span>
        </div>
        <span className="text-xs text-gray-400 shrink-0">
          {new Date(app.createdAt).toLocaleDateString("tr-TR")}
        </span>
      </div>
      <p className="text-xs text-gray-500">
        {app.user.displayName ?? "İsimsiz"} · {app.user.email}
        {app.city && ` · ${app.city}${app.district ? ` / ${app.district}` : ""}`}
      </p>
      {app.expertiseTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {app.expertiseTags.map((t) => (
            <span key={t} className="px-2 py-0.5 rounded-full text-[11px] bg-gray-100 text-gray-600">{t}</span>
          ))}
        </div>
      )}
      {app.bio && <p className="text-sm text-gray-700 whitespace-pre-line">{app.bio}</p>}
      <div className="pt-1 border-t border-gray-50">
        <ExpertApplicationActions profileId={app.id} status={app.status} />
      </div>
    </div>
  );
}
