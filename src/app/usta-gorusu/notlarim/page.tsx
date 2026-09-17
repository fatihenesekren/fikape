import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { finalizeExpiredAppeals } from "@/lib/expertAppeal";
import { ExpertAppealForm } from "../ExpertAppealForm";
import { ExpertNoteRowActions } from "./ExpertNoteRowActions";
import { EXPERT_STATUS_TONES } from "@/lib/expertNote";
import { listTimeLabel } from "@/lib/messageTime";

// Sağa dönük ok — kart başlığının "sayfada görüntüle" olduğunu ima eder
// (ExpertNotesSection.tsx'teki inline SVG ikon deseniyle aynı).
function ArrowRightIcon({ className = "" }: { className?: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M5 12h14" />
      <path d="M13 6l6 6-6 6" />
    </svg>
  );
}

export const metadata = { title: "Usta Notlarım — fikape", robots: { index: false } };

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
      model: {
        select: {
          name: true, brand: { select: { name: true } },
          // Yayındaki nota sayfa üzerinden erişim linki için — admin/expert-answers'daki
          // aynı desen (en çok görüntülenen aktif ürün, model'in kendi sayfası yok).
          products: {
            where: { isActive: true },
            orderBy: { weeklyViewCount: "desc" },
            take: 1,
            select: { slug: true },
          },
        },
      },
      appeals: { select: { status: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const now = new Date();

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      {/* ⟳ /profil değil /usta-gorusu hub'ına dönüyor artık (aktif ustanın
          iş akışı oraya taşındı) — link metni de hedefin h1'iyle
          ("Usta Panelim") eşleşsin diye güncellendi. */}
      <Link href="/usta-gorusu" className="inline-flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-gray-800 mb-4">
        ← Usta Panelime dön
      </Link>
      <div className="mb-1 flex items-center justify-between gap-2">
        <h1 className="text-2xl font-black text-gray-900">Usta Notlarım</h1>
        <Link
          href="/usta-gorusu/yaz"
          className="shrink-0 inline-flex items-center gap-1 rounded-xl px-3.5 py-2 text-xs font-semibold text-white"
          style={{ background: "var(--btn-dark)" }}
        >
          + Yeni not yaz
        </Link>
      </div>
      <p className="text-sm text-gray-400 mb-6">Yazdığınız teknik notlar ve durumları.</p>

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
        // Mesajlarım/Takas listesiyle aynı modern liste deseni: tek kart,
        // satırlar arası ince ayraç — önceki her-not-ayrı-kutu görünümü
        // yerine (görsel denetim: "Sayfada görüntüle" linki Düzenle/Sil'in
        // yanına sıkışmıştı, hiyerarşisiz duruyordu). Artık başlığın kendisi
        // yayındaki nota giden birincil eylem (ok ikonlu); Düzenle/Sil ayrı
        // bir alt satırda, ince bir üst çizgiyle görsel olarak ayrılmış.
        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden divide-y divide-gray-50">
          {notes.map((n) => {
            const badge = STATUS_LABEL[n.status] ?? { label: n.status, ...EXPERT_STATUS_TONES.neutral };
            const appeal = n.appeals[0];
            const productSlug = n.model.products[0]?.slug;
            const pageHref = productSlug ? `/araclar/${productSlug}?sekme=usta-gorusleri#usta-not-${n.id}` : null;
            const isPublished = n.status === "PUBLISHED" && pageHref;
            return (
              <div key={n.id} className="px-4 py-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-gray-400 truncate">{n.model.brand.name} {n.model.name}</span>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold shrink-0" style={{ color: badge.color, background: badge.bg }}>
                    {badge.label}
                  </span>
                </div>

                {isPublished ? (
                  <Link href={pageHref} className="group flex items-center gap-1.5 mt-1 -ml-0.5 pl-0.5 rounded hover:bg-gray-50">
                    <span className="text-[15px] font-bold text-gray-900 group-hover:text-link transition-colors">{n.title}</span>
                    <ArrowRightIcon className="text-gray-300 group-hover:text-link transition-colors shrink-0" />
                  </Link>
                ) : (
                  <p className="text-[15px] font-bold text-gray-900 mt-1">{n.title}</p>
                )}
                <p className="text-[11px] text-gray-400 mt-0.5">{listTimeLabel(n.createdAt, now)}</p>

                {n.status === "REJECTED" && (
                  <div className="mt-1.5 space-y-1.5">
                    {n.rejectionReason && <p className="text-xs text-gray-500">Gerekçe: {n.rejectionReason}</p>}
                    <ExpertAppealForm subjectType="NOTE_REJECTION" noteId={n.id} existingStatus={appeal?.status ?? null} />
                  </div>
                )}

                <div className="mt-3 pt-3 border-t border-gray-50">
                  <ExpertNoteRowActions noteId={n.id} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
