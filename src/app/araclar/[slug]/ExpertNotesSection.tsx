import Link from "next/link";
import { EXPERT_BADGE, EXPERT_NOTE_DISCLAIMER, EXPERT_NOTE_FIELDS, EXPERT_NOTE_SCOPE_KEY } from "@/lib/expertNote";
import { ExpertNoteVoteButtons } from "@/components/ExpertNoteVoteButtons";
import { ExpertNoteQna, type ExpertNoteQuestionView } from "./ExpertNoteQna";
import { RegionalExpertsBlock } from "./RegionalExpertsBlock";
import { RegionOptInPrompt } from "./RegionOptInPrompt";
import type { RegionalSummary } from "@/lib/expertRegional";

// Boş-durum DAİRESİ — "kayıt/not defteri boş" durumunu anlatır (durum ikonu).
// "Teknik not ekle" BUTONU — yazma EYLEMİni anlatır (kalem). Bilinçli olarak
// FARKLI ikonlar: aynı ikonun (🔧 usta rozeti dahil) her yerde tekrarı
// kimlik/durum/eylem ayrımını bulanıklaştırıyordu (3 ayrı ajan panelinin
// ortak sonucu — bkz. feature_usta_gorusleri_ilerleme, 14 Eylül 2026).
function ClipboardIcon({ className = "" }: { className?: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <rect x="6" y="4" width="12" height="17" rx="2" />
      <path d="M9 4a1 1 0 0 1 1-2h4a1 1 0 0 1 1 2" />
      <line x1="9" y1="11" x2="15" y2="11" />
      <line x1="9" y1="15" x2="13" y2="15" />
    </svg>
  );
}

function EditIcon({ className = "" }: { className?: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}

export interface ExpertNoteView {
  id: number;
  title: string;
  body: string;
  structured: Record<string, string>;
  city: string | null;
  authorName: string;
  authorSlug: string | null;
  authorUserId: number;
  createdAt: string;
  helpfulCount: number;
  currentUserVote: boolean | null;
  questions: ExpertNoteQuestionView[];
}

// "Usta Görüşleri" tab içeriği — model seviyesi teknik notlar. Skorsuz.
// Not kartında yalnızca İL gösterilir (ilçe yalnız usta profilinde — §9).
export function ExpertNotesSection({
  notes, isLoggedIn, currentUserId, canAnswer, canWriteNote, writeNoteHref, regionalSummary, showRegionOptIn,
}: {
  notes: ExpertNoteView[];
  isLoggedIn: boolean;
  currentUserId: number | null;
  canAnswer: boolean;
  canWriteNote: boolean;
  writeNoteHref: string;
  regionalSummary: RegionalSummary | null;
  showRegionOptIn: boolean;
}) {
  if (notes.length === 0) {
    // Bu dal artık yalnız YAZABİLECEK aktif usta tarafından görülebilir —
    // sıradan kullanıcıya sekme zaten 0 nottayken hiç açılmıyor (TabView).
    // Yine de savunmacı olarak usta-olmayan bir fallback bırakıldı.
    if (!canWriteNote) {
      return (
        <div className="p-10 text-center text-sm text-gray-400">
          Bu model için henüz usta görüşü yok.
        </div>
      );
    }
    return (
      <div className="p-10 text-center">
        <div className="mx-auto mb-3.5 w-11 h-11 rounded-full flex items-center justify-center" style={{ background: EXPERT_BADGE.bg, color: EXPERT_BADGE.color }}>
          <ClipboardIcon />
        </div>
        <p className="text-sm font-semibold text-gray-900">Bu araç için ilk teknik notu siz paylaşabilirsiniz</p>
        <p className="text-xs text-gray-400 mt-1.5 max-w-xs mx-auto leading-relaxed">
          Kronik arıza, bakım maliyeti ya da parça bulunurluğu hakkındaki gözleminiz, bu aracı araştıran kullanıcılara doğrudan fayda sağlar.
        </p>
        <Link
          href={writeNoteHref}
          className="mt-4 inline-flex items-center gap-1.5 rounded-xl border px-4 py-2 text-xs font-semibold"
          style={{ background: EXPERT_BADGE.bg, color: EXPERT_BADGE.color, borderColor: "rgba(122,62,0,0.3)" }}
        >
          <EditIcon />Teknik not ekle
        </Link>
      </div>
    );
  }

  return (
    <div>
      <p className="px-5 pt-4 text-[11px] text-gray-400 leading-relaxed border-b border-gray-50 pb-3">
        {EXPERT_NOTE_DISCLAIMER}
      </p>

      {/* Yazabilecek aktif ustaya, mevcut notların üstünde katkı daveti —
          bilgi şeridinin kendisi ikonsuz (kimlik/eylem sembolüyle karışmasın). */}
      {canWriteNote && (
        <div className="flex items-center gap-3 px-5 py-3 border-b border-gray-50" style={{ background: "#FAFBFD" }}>
          <p className="flex-1 text-xs" style={{ color: "#0C447C" }}>Bu model hakkında bildiğiniz başka bir şey mi var?</p>
          <Link
            href={writeNoteHref}
            className="shrink-0 inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-[11px] font-semibold"
            style={{ background: EXPERT_BADGE.bg, color: EXPERT_BADGE.color, borderColor: "rgba(122,62,0,0.3)" }}
          >
            <EditIcon />Teknik not ekle
          </Link>
        </div>
      )}

      {/* Bölgesel görünürlük — yalnız FEATURED ustalar, sert eşik geçildiyse (Aşama 9) */}
      <RegionalExpertsBlock summary={regionalSummary} />
      {showRegionOptIn && regionalSummary?.city == null && <RegionOptInPrompt />}

      <div className="divide-y divide-gray-50">
        {notes.map((n) => (
          <article key={n.id} id={`usta-not-${n.id}`} className="px-5 py-5 space-y-3 scroll-mt-24">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
                style={{ color: EXPERT_BADGE.color, background: EXPERT_BADGE.bg }}
                title={EXPERT_BADGE.tooltip}
              >
                {EXPERT_BADGE.icon} {EXPERT_BADGE.label}
              </span>
              {n.authorSlug ? (
                <Link href={`/usta/${n.authorSlug}`} className="text-xs text-gray-500 hover:underline">
                  {n.authorName}
                </Link>
              ) : (
                <span className="text-xs text-gray-500">{n.authorName}</span>
              )}
              {n.city && <span className="text-xs text-gray-400">· {n.city}</span>}
            </div>

            <h3 className="text-sm font-bold text-gray-900">{n.title}</h3>

            {/* Kapsam uyarısı — bu not tüm varyantlar için değil, belirli bir
                motor/yakıt/donanım içinmiş gibi okunmaması için gövdeden ÖNCE,
                ayrı bir rozet olarak gösterilir (bkz. lib/expertNote.ts). */}
            {n.structured[EXPERT_NOTE_SCOPE_KEY] && (
              <p className="text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-2.5 py-1.5 inline-block">
                ⚠️ Bu not: {n.structured[EXPERT_NOTE_SCOPE_KEY]}
              </p>
            )}

            <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">{n.body}</p>

            {EXPERT_NOTE_FIELDS.some((f) => f.key !== EXPERT_NOTE_SCOPE_KEY && n.structured[f.key]) && (
              <dl className="space-y-2 pt-1">
                {EXPERT_NOTE_FIELDS.filter((f) => f.key !== EXPERT_NOTE_SCOPE_KEY && n.structured[f.key]).map((f) => (
                  <div key={f.key} className="bg-gray-50 rounded-lg px-3 py-2">
                    <dt className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">{f.label}</dt>
                    <dd className="text-sm text-gray-700 whitespace-pre-line mt-0.5">{n.structured[f.key]}</dd>
                  </div>
                ))}
              </dl>
            )}

            <ExpertNoteVoteButtons
              noteId={n.id}
              initialHelpfulCount={n.helpfulCount}
              initialUserVote={n.currentUserVote}
              isLoggedIn={isLoggedIn}
              isOwnNote={currentUserId === n.authorUserId}
            />

            <ExpertNoteQna
              noteId={n.id}
              questions={n.questions}
              isLoggedIn={isLoggedIn}
              canAnswer={canAnswer}
            />
          </article>
        ))}
      </div>
    </div>
  );
}
