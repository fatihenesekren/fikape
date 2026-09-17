import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { EXPERT_STATUS_TONES } from "@/lib/expertNote";

export const metadata: Metadata = { title: "Usta Panelim — fikape", robots: { index: false } };

// Ayarlar linkindeki dişli ikonu — ExpertNotesSection.tsx'teki EditIcon
// deseniyle aynı inline SVG stili.
function GearIcon({ className = "" }: { className?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
    </svg>
  );
}

// Usta Panelim — aktif ustanın kendi paneli. Önceden /profil sayfasının
// altında gömülü bir karttı; kullanıcı ekran görüntüsüyle "küçük kalıyor,
// büyütelim" dedi, 5 ajanlı bir bölüm-içi taşıma denendi ama sonuç
// (istatistik satırı + tam-genişlik CTA bug'ı) daha kötü göründü —
// kullanıcı "ayrı bir sayfaya taşısak, Garajım gibi" dedi. Bu sayfa o karar:
// /garajim'in aynı iskeleti (max-w-3xl, h1 başlık + alt metin, metrik grid)
// kullanılarak, /usta-gorusu boş route'una (daha önce hiç page.tsx yoktu,
// yalnız ExpertAppealForm.tsx alt bileşeni vardı) yerleştirildi.
export default async function UstaGorusumPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/giris?callbackUrl=/usta-gorusu");

  const userId = Number(session.user.id);

  const profile = await prisma.expertProfile.findUnique({
    where: { userId },
    select: { id: true, status: true, slug: true },
  });

  // notlarim/page.tsx'teki AYNI kapı — aktif olmayan biri URL'i doğrudan
  // yazarsa /profil'e (kendi Topluluk kartındaki durum mesajını görsün diye).
  if (!profile || profile.status !== "ACTIVE") {
    redirect("/profil");
  }

  const [expertNoteCount, unreadExpertMessageCount] = await Promise.all([
    // usta-gorusu/notlarim/page.tsx'teki listeyle AYNI filtre.
    prisma.expertNote.count({ where: { profileId: profile.id, status: { not: "HIDDEN" } } }),
    // api/messages/preview/route.ts'teki usta okunmamış sayımıyla AYNI —
    // tutarsız iki sayı göstermeyelim diye.
    prisma.expertMessage.count({
      where: { isRead: false, senderId: { not: userId }, thread: { OR: [{ initiatorId: userId }, { expertProfile: { userId } }] } },
    }),
  ]);

  return (
    <div className="max-w-3xl w-full mx-auto px-4 py-10">
      {/* HomeFab scroll sonrası beliren bir "eve dön" butonu zaten sağlıyor,
          ama hemen görünen, scroll gerektirmeyen bir link de istendi
          (kullanıcı) — sitenin diğer sayfalarındaki (gizlilik,
          kullanim-kosullari, usta-basvuru vb.) AYNI "← Ana sayfaya dön"
          metni/deseni. */}
      <Link href="/" className="inline-flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-gray-800 mb-6">
        ← Ana sayfaya dön
      </Link>
      <div className="mb-8">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2 flex-wrap">
              Usta Panelim
              <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold" style={{ color: EXPERT_STATUS_TONES.success.color, background: EXPERT_STATUS_TONES.success.bg }}>
                Aktif
              </span>
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Yeni bir usta görüşü yazabilir, danışan mesajlarınızı görebilirsiniz.
            </p>
          </div>
          <Link
            href="/usta-gorusu/profil"
            className="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold border-2 border-gray-200 text-gray-700 hover:border-gray-300 transition-colors"
          >
            <GearIcon className="w-4 h-4" />
            Ayarlar
          </Link>
        </div>
      </div>

      {/* İstatistikler — /profil'in kendi metrik grid deseniyle AYNI
          (text-2xl font-black + text-xs gray-400 label), emoji/ikon yok —
          bir önceki denemede emoji'lerin bazı ortamlarda bozuk render
          olması sorunun bir parçasıydı, bu desen zaten kanıtlanmış. */}
      <div className="grid grid-cols-2 gap-4 mb-8 bg-white border border-gray-100 rounded-2xl p-5">
        <div className="text-center">
          <div className="text-2xl font-black text-gray-900">{expertNoteCount}</div>
          <div className="text-xs text-gray-400 mt-0.5">Yazdığınız not</div>
        </div>
        <div className="text-center">
          <div className={`text-2xl font-black ${unreadExpertMessageCount > 0 ? "text-red-600" : "text-gray-900"}`}>
            {unreadExpertMessageCount}
          </div>
          <div className="text-xs text-gray-400 mt-0.5">Okunmamış mesaj</div>
        </div>
      </div>

      {/* Kısayollar — Garajım'daki tekil "Takas Pazarına Gözat" linkinin
          aksine burada üç eşit ağırlıklı hedef var, bu yüzden grid kart. */}
      <div className="grid sm:grid-cols-3 gap-3 mb-6">
        <Link
          href={`/usta/${profile.slug}`}
          className="px-4 py-3.5 rounded-2xl border border-gray-100 bg-white hover:shadow-sm transition-shadow text-sm font-semibold text-gray-900 text-center"
        >
          Usta Profilim
        </Link>
        <Link
          href="/usta-gorusu/notlarim"
          className="px-4 py-3.5 rounded-2xl border border-gray-100 bg-white hover:shadow-sm transition-shadow text-sm font-semibold text-gray-900 text-center"
        >
          Usta Notlarım
        </Link>
        <Link
          href="/mesajlar?tab=usta"
          className="px-4 py-3.5 rounded-2xl border border-gray-100 bg-white hover:shadow-sm transition-shadow text-sm font-semibold text-gray-900 text-center"
        >
          Usta Mesajlarım
        </Link>
      </div>

      <Link
        href="/usta-gorusu/yaz"
        className="inline-flex items-center gap-1.5 px-5 py-3 rounded-xl text-sm font-semibold text-white"
        style={{ background: "var(--btn-dark)" }}
      >
        Usta Görüşü Yaz →
      </Link>
    </div>
  );
}
