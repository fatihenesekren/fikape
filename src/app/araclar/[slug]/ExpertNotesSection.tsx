import Link from "next/link";
import { EXPERT_BADGE, EXPERT_NOTE_DISCLAIMER, EXPERT_NOTE_FIELDS } from "@/lib/expertNote";

export interface ExpertNoteView {
  id: number;
  title: string;
  body: string;
  structured: Record<string, string>;
  city: string | null;
  authorName: string;
  authorSlug: string | null;
  createdAt: string;
}

// "Usta Görüşleri" tab içeriği — model seviyesi teknik notlar. Skorsuz.
// Not kartında yalnızca İL gösterilir (ilçe yalnız usta profilinde — §9).
export function ExpertNotesSection({ notes }: { notes: ExpertNoteView[] }) {
  if (notes.length === 0) {
    return (
      <div className="p-10 text-center text-sm text-gray-400">
        Bu model için henüz usta görüşü yok.
      </div>
    );
  }

  return (
    <div>
      <p className="px-5 pt-4 text-[11px] text-gray-400 leading-relaxed border-b border-gray-50 pb-3">
        {EXPERT_NOTE_DISCLAIMER}
      </p>
      <div className="divide-y divide-gray-50">
        {notes.map((n) => (
          <article key={n.id} className="px-5 py-5 space-y-3">
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
            <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">{n.body}</p>

            {EXPERT_NOTE_FIELDS.some((f) => n.structured[f.key]) && (
              <dl className="space-y-2 pt-1">
                {EXPERT_NOTE_FIELDS.filter((f) => n.structured[f.key]).map((f) => (
                  <div key={f.key} className="bg-gray-50 rounded-lg px-3 py-2">
                    <dt className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">{f.label}</dt>
                    <dd className="text-sm text-gray-700 whitespace-pre-line mt-0.5">{n.structured[f.key]}</dd>
                  </div>
                ))}
              </dl>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
