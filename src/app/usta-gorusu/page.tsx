import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { EXPERT_STATUS_TONES } from "@/lib/expertNote";
import { GearIcon, IdCardIcon, ClipboardIcon, MessageIcon } from "@/components/icons";

export const metadata: Metadata = { title: "Usta Panelim — fikape", robots: { index: false } };

// Usta Panelim — aktif ustanın kendi paneli. Önceden /profil sayfasının
// altında gömülü bir karttı; kullanıcı ekran görüntüsüyle "küçük kalıyor,
// büyütelim" dedi, 5 ajanlı bir bölüm-içi taşıma denendi ama sonuç
// (istatistik satırı + tam-genişlik CTA bug'ı) daha kötü göründü —
// kullanıcı "ayrı bir sayfaya taşısak, Garajım gibi" dedi. Bu sayfa o
// karar: /garajim'in aynı konteyner genişliğini (max-w-3xl) kullanır,
// kendi özel header düzenine sahiptir (rozet + Ayarlar butonu var).
//
// ⟳ 17 Eylül 2026 — 3 ajanlı (görsel/layout/frontend) genel denetim:
// - CTA ("Usta Görüşü Yaz") en alttan üste, header'ın hemen altına
//   taşındı — sayfanın birincil eylemi artık ilk göze çarpan şey
//   (layout ajanı: eskiden sayfanın dibinde izole/unutulmuş duruyordu).
// - 3 kısayol ikonuna renk aksanı verildi (--link mavi/amber/emerald) —
//   önceden üçü de düz gri, birbirinden ayrışmıyordu (görsel ajanı).
// - İstatistik kartı artık `bg-gray-50` (kısayol kartlarından — beyaz —
//   görsel olarak ayrışsın diye, önceden ikisi de birebir aynı stildi).
// - Dikey boşluklar tek bir mb-8 ritmine sabitlendi (önceden 6/8/8/6
//   karışıktı).
// - GearIcon/IdCardIcon/ClipboardIcon/MessageIcon artık burada TEKRAR
//   TANIMLI DEĞİL — src/components/icons.tsx'ten import ediliyor (frontend
//   ajanı: aynı SVG'ler usta/[slug]/page.tsx ve ExpertNotesSection.tsx'te
//   de tekrarlanıyordu, tek kaynağa çıkarıldı).
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
          metni/deseni. Farklı bir hiyerarşi seviyesi olduğu için mb-6,
          aşağıdaki bölüm-arası ritimden (mb-8) bilinçli olarak ayrı. */}
      <Link href="/" className="inline-flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-gray-800 mb-6">
        ← Ana sayfaya dön
      </Link>

      {/* items-center: rozet+alt metinle iki satırlık başlık bloğu ile
          tek satırlık "Ayarlar" butonu artık dikeyde ortalanıyor (önceden
          items-start ile buton üstte "yüzüyor" gibi duruyordu). */}
      <div className="mb-8">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2 flex-wrap">
              Usta Panelim
              <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold" style={{ color: EXPERT_STATUS_TONES.success.color, background: EXPERT_STATUS_TONES.success.bg }}>
                Aktif
              </span>
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Yeni bir usta görüşü yazabilir, <span style={{ color: "var(--link)" }}>danışan mesajlarınızı</span> görebilirsiniz.
            </p>
          </div>
          <Link
            href="/usta-gorusu/profil"
            className="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold border-2 border-gray-200 text-gray-700 hover:border-gray-300 transition-colors"
          >
            <GearIcon size={16} />
            Ayarlar
          </Link>
        </div>
      </div>

      {/* Birincil eylem — üste taşındı (layout ajanı: eskiden sayfanın
          dibinde izole duruyordu). Aynı içerik türü olduğu için
          Notlarım'daki AYNI ClipboardIcon önde (kullanıcı isteği).
          ⟳ 2. tur 3 ajanlı ince ayar: py-3.5→py-3 (sitenin diğer siyah
          CTA'larının çoğu px-5 py-2.5 kullanıyor — burası birincil eylem
          olduğu için biraz daha vurgulu kalsın ama eski hali "hero buton"
          gibi ağır duruyordu), rounded-xl→rounded-2xl (alttaki kartlarla
          aynı köşe yarıçapı — önceden tek uyumsuz köşeydi). */}
      <Link
        href="/usta-gorusu/yaz"
        className="flex items-center justify-center gap-2 w-full sm:w-auto px-5 py-3 rounded-2xl text-sm font-semibold text-white mb-8"
        style={{ background: "var(--btn-dark)" }}
      >
        <ClipboardIcon size={16} className="text-white" />
        Usta Görüşü Yaz →
      </Link>

      {/* İstatistikler — /profil'in kendi metrik grid deseniyle AYNI
          (text-2xl font-black + text-xs gray-400 label), emoji/ikon yok —
          bir önceki denemede emoji'lerin bazı ortamlarda bozuk render
          olması sorunun bir parçasıydı, bu desen zaten kanıtlanmış.
          ⟳ bg-gray-50 — aşağıdaki (beyaz) kısayol kartlarından görsel
          olarak ayrışsın diye (görsel ajanı: ikisi birebir aynı stildi).
          p-6→p-5 (2. tur: layout ajanı, sadece 2 sayı için fazla şişkin
          duruyordu, kısayol kartlarının py-3.5'iyle orantısızdı). */}
      <div className="grid grid-cols-2 gap-4 mb-8 bg-gray-50 border border-gray-100 rounded-2xl p-5">
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
          aksine burada üç eşit ağırlıklı hedef var, bu yüzden grid kart.
          ⟳ Her ikona kendi renk aksanlı rozet zemini verildi (görsel
          ajanı: önceden üçü de düz gri, birbirinden ayrışmıyordu).
          ⟳ 2. tur — marka/profesyonellik ajanı: ham Tailwind amber/emerald
          yerine fikape'nin KENDİ FI·KA·PE token ailesi kullanılıyor
          (--fi/--ka/--pe + -bg/-color varyantları, globals.css) — hem
          "Aktif" rozetinin yeşiliyle "Mesajlarım"ın yeşili artık aynı
          kaynaktan (marka tutarlılığı), hem sayfa "kendi rastgele renk
          setini icat eden" değil markanın bir uzantısı gibi duruyor.
          Profilim --fi (mavi), Notlarım --pe (kahverengi), Mesajlarım
          --ka (yeşil) — üçü keyfi değil, üç AYRI hedefi göz taramasında
          hızlıca ayırt etmeyi sağlıyor. */}
      <div className="grid sm:grid-cols-3 gap-3">
        <Link
          href={`/usta/${profile.slug}`}
          className="flex items-center justify-center gap-2.5 px-4 py-3.5 rounded-2xl border border-gray-200 bg-white hover:border-[var(--fi)]/40 hover:shadow-sm transition-all text-sm font-semibold text-gray-900"
        >
          <span className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: "var(--fi-bg)" }}>
            <IdCardIcon size={16} className="text-[var(--fi-color)]" />
          </span>
          Usta Profilim
        </Link>
        <Link
          href="/usta-gorusu/notlarim"
          className="flex items-center justify-center gap-2.5 px-4 py-3.5 rounded-2xl border border-gray-200 bg-white hover:border-[var(--pe)]/40 hover:shadow-sm transition-all text-sm font-semibold text-gray-900"
        >
          <span className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: "var(--pe-bg)" }}>
            <ClipboardIcon size={16} className="text-[var(--pe-color)]" />
          </span>
          Usta Notlarım
        </Link>
        <Link
          href="/mesajlar?tab=usta"
          className="flex items-center justify-center gap-2.5 px-4 py-3.5 rounded-2xl border border-gray-200 bg-white hover:border-[var(--ka)]/40 hover:shadow-sm transition-all text-sm font-semibold text-gray-900"
        >
          <span className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: "var(--ka-bg)" }}>
            <MessageIcon size={16} className="text-[var(--ka-color)]" />
          </span>
          Usta Mesajlarım
        </Link>
      </div>
    </div>
  );
}
