import { prisma } from "@/lib/prisma";
import { ExpertNoteActions } from "./ExpertNoteActions";
import { ExpertAnswerActions } from "./ExpertAnswerActions";
import { ExpertOverrideActions } from "./ExpertOverrideActions";
import { BootstrapExpertForm } from "./BootstrapExpertForm";
import { EXPERT_NOTE_FIELDS } from "@/lib/expertNote";

export const metadata = { title: "Usta Notları — fikape admin" };

const VISIBILITY_LABEL: Record<string, string> = {
  HIDDEN: "Gizli (kapı geçilmedi)",
  FEATURED: "Görünür",
  PAUSED: "Duraklatıldı",
  PROBATION: "Denetimde",
};

export default async function ExpertNotesModerationPage() {
  const [notes, activeProfiles, pendingAnswers] = await Promise.all([
    prisma.expertNote.findMany({
      where: { status: "PENDING" },
      select: {
        id: true, title: true, body: true, structured: true, createdAt: true,
        model: { select: { name: true, brand: { select: { name: true } } } },
        profile: {
          select: {
            city: true,
            user: { select: { displayName: true, email: true } },
            // Bu ustanın ilk notu mu, yoksa daha önce onaylanmış notu var mı —
            // hafif bir triaj sinyali (tam risk skoru ileride).
            notes: { select: { status: true } },
          },
        },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.expertProfile.findMany({
      where: { status: "ACTIVE" },
      select: {
        id: true, headline: true, city: true, visibilityState: true, adminOverride: true,
        currentPeriodScore: true, graceUntil: true,
        user: { select: { displayName: true, email: true } },
      },
      orderBy: { headline: "asc" },
    }).catch(() => []),
    // Usta notu altındaki soru-cevap — "B modeli" moderasyonu (§14.9)
    prisma.answer.findMany({
      where: { status: "PENDING", answeredByExpertProfileId: { not: null } },
      select: {
        id: true, text: true, createdAt: true,
        question: { select: { text: true, expertNote: { select: { title: true } } } },
      },
      orderBy: { createdAt: "asc" },
    }).catch(() => []),
  ]);

  return (
    <div className="px-4 sm:px-8 py-10 max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
          Usta Notları
          {notes.length > 0 && (
            <span className="px-2 py-0.5 rounded-full text-sm font-bold bg-orange-100 text-orange-700">
              {notes.length} bekliyor
            </span>
          )}
        </h1>
        <p className="text-sm text-gray-400 mt-1">
          Onaylanan not, ilgili modelin araç sayfasında &quot;Usta Görüşleri&quot; sekmesinde yayınlanır.
          Aktif usta sayısı: {activeProfiles.length}.
        </p>
      </div>

      {/* GEÇİCİ bootstrap — Aşama 5 (herkese açık başvuru) gelene kadar */}
      <div className="bg-white border border-gray-100 rounded-xl p-4 space-y-2">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">
          Kullanıcıyı Usta Yap (geçici — başvuru formu gelene kadar)
        </p>
        <BootstrapExpertForm />
      </div>

      {activeProfiles.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">
            Aktif Ustalar — Görünürlük (aylık barem)
          </p>
          {activeProfiles.map((p) => (
            <div key={p.id} className="bg-white border border-gray-100 rounded-xl p-4 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-sm min-w-0">
                  <span className="font-semibold text-gray-800">{p.headline ?? p.user.displayName ?? p.user.email}</span>
                  {p.city && <span className="text-gray-400"> · {p.city}</span>}
                </div>
                <span className="text-xs text-gray-400 shrink-0">
                  {VISIBILITY_LABEL[p.visibilityState] ?? p.visibilityState}
                  {p.currentPeriodScore != null && ` · skor ${p.currentPeriodScore.toFixed(2)}`}
                  {p.graceUntil && p.graceUntil > new Date() && " · grace"}
                  {p.adminOverride && ` · override: ${p.adminOverride}`}
                </span>
              </div>
              <ExpertOverrideActions profileId={p.id} adminOverride={p.adminOverride} />
            </div>
          ))}
        </div>
      )}

      {pendingAnswers.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">
            Usta Notu Cevapları ({pendingAnswers.length} bekliyor)
          </p>
          {pendingAnswers.map((a) => (
            <div key={a.id} className="bg-white border border-gray-100 rounded-xl p-4 space-y-2">
              <p className="text-xs text-gray-400">{a.question.expertNote?.title}</p>
              <p className="text-sm text-gray-500 italic">&quot;{a.question.text}&quot;</p>
              <p className="text-sm text-gray-800 bg-gray-50 rounded-lg px-3 py-2">{a.text}</p>
              <div className="flex items-center justify-between gap-2 pt-1 border-t border-gray-50">
                <span className="text-xs text-gray-400">{new Date(a.createdAt).toLocaleDateString("tr-TR")}</span>
                <ExpertAnswerActions answerId={a.id} />
              </div>
            </div>
          ))}
        </div>
      )}

      {notes.length === 0 ? (
        <p className="text-sm text-gray-400">Bekleyen usta notu yok.</p>
      ) : (
        <div className="space-y-3">
          {notes.map((n) => {
            const approvedBefore = n.profile.notes.some((x) => x.status === "PUBLISHED");
            const structured = (n.structured ?? {}) as Record<string, string>;
            return (
              <div key={n.id} className="bg-white border border-gray-100 rounded-xl p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-sm min-w-0">
                    <span className="font-semibold text-gray-800">
                      {n.model.brand.name} {n.model.name}
                    </span>
                    <span className="text-gray-400"> · {n.profile.user.displayName ?? n.profile.user.email}</span>
                    {n.profile.city && <span className="text-gray-400"> · {n.profile.city}</span>}
                  </div>
                  {!approvedBefore && (
                    <span className="shrink-0 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700">
                      ilk not
                    </span>
                  )}
                </div>

                <h3 className="text-sm font-bold text-gray-900">{n.title}</h3>
                <p className="text-sm text-gray-700 whitespace-pre-line">{n.body}</p>

                {EXPERT_NOTE_FIELDS.some((f) => structured[f.key]) && (
                  <dl className="space-y-1.5">
                    {EXPERT_NOTE_FIELDS.filter((f) => structured[f.key]).map((f) => (
                      <div key={f.key} className="bg-gray-50 rounded-lg px-3 py-2">
                        <dt className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">{f.label}</dt>
                        <dd className="text-sm text-gray-700 whitespace-pre-line mt-0.5">{structured[f.key]}</dd>
                      </div>
                    ))}
                  </dl>
                )}

                <div className="flex items-center justify-between gap-2 pt-1 border-t border-gray-50">
                  <span className="text-xs text-gray-400">
                    {new Date(n.createdAt).toLocaleDateString("tr-TR")}
                  </span>
                  <ExpertNoteActions noteId={n.id} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
