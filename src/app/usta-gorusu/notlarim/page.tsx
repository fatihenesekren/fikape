import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { finalizeExpiredAppeals } from "@/lib/expertAppeal";
import { ExpertAppealForm } from "../ExpertAppealForm";
import { ExpertNoteRowActions } from "./ExpertNoteRowActions";
import { EXPERT_STATUS_TONES } from "@/lib/expertNote";

export const metadata = { title: "Notlarım — fikape", robots: { index: false } };

const STATUS_LABEL: Record<string, { label: string; color: string; bg: string }> = {
  PENDING: { label: "İnceleniyor", ...EXPERT_STATUS_TONES.warning },
  PUBLISHED: { label: "Yayında", ...EXPERT_STATUS_TONES.success },
  REJECTED: { label: "Reddedildi", ...EXPERT_STATUS_TONES.danger },
};

export default async function ExpertMyNotesPage() {
  const session = await auth();
  if (!session) redirect("/giris?callbackUrl=/usta-gorusu/notlarim");
  const userId = parseInt(session.user.id);

  const profile = await prisma.expertProfile.findUnique({
    where: { userId },
    select: { id: true, status: true },
  });
  if (!profile || profile.status !== "ACTIVE") {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center space-y-4">
        <div className="text-4xl">🔧</div>
        <h1 className="text-xl font-black text-gray-900">Bu sayfa yalnızca aktif ustalar içindir</h1>
        <Link href="/profil" className="inline-block mt-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white" style={{ background: "var(--btn-dark)" }}>
          Profile dön →
        </Link>
      </div>
    );
  }

  await finalizeExpiredAppeals();

  const notes = await prisma.expertNote.findMany({
    where: { profileId: profile.id, status: { not: "HIDDEN" } },
    select: {
      id: true, title: true, status: true, rejectionReason: true, createdAt: true,
      model: { select: { name: true, brand: { select: { name: true } } } },
      appeals: { select: { status: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="mb-6 flex items-center justify-between gap-2">
        <h1 className="text-2xl font-black text-gray-900">Notlarım</h1>
        <Link href="/usta-gorusu/yaz" className="text-xs font-semibold text-gray-500 hover:text-gray-800">
          + Yeni not yaz
        </Link>
      </div>

      {notes.length === 0 ? (
        // Önceden çıplak bir metin satırıydı — özelliğin geri kalanındaki
        // (mesajlar, usta profili, araç sayfası) ikon+kart+CTA desenine
        // taşındı (görsel denetim bulgusu).
        <div className="bg-white border-2 border-dashed border-gray-100 rounded-2xl p-10 text-center">
          <div className="mx-auto mb-3.5 w-11 h-11 rounded-full flex items-center justify-center text-lg" style={{ background: "#FBEEDF" }}>
            📝
          </div>
          <p className="text-sm font-semibold text-gray-800">Henüz bir usta notu yazmadınız</p>
          <p className="text-xs text-gray-400 mt-1">Bir araç modeli hakkındaki teknik gözleminizi paylaşarak başlayın.</p>
          <Link
            href="/usta-gorusu/yaz"
            className="mt-4 inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold text-white"
            style={{ background: "var(--btn-dark)" }}
          >
            İlk notunuzu yazın →
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {notes.map((n) => {
            const badge = STATUS_LABEL[n.status] ?? { label: n.status, ...EXPERT_STATUS_TONES.neutral };
            const appeal = n.appeals[0];
            return (
              <div key={n.id} className="bg-white border border-gray-100 rounded-xl p-4 space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-gray-400">{n.model.brand.name} {n.model.name}</span>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold shrink-0" style={{ color: badge.color, background: badge.bg }}>
                    {badge.label}
                  </span>
                </div>
                <p className="text-sm font-semibold text-gray-800">{n.title}</p>
                {n.status === "REJECTED" && (
                  <>
                    {n.rejectionReason && <p className="text-xs text-gray-500">Gerekçe: {n.rejectionReason}</p>}
                    <ExpertAppealForm subjectType="NOTE_REJECTION" noteId={n.id} existingStatus={appeal?.status ?? null} />
                  </>
                )}
                <ExpertNoteRowActions noteId={n.id} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
