import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isTradeListingEnabled } from "@/lib/features";
import { stripGenRangeAnywhere } from "@/lib/modelDisplay";
import { takasUygunlukToplu, enIlerideArac, takasSonrakiAdim, type TakasAracUygunlugu } from "@/lib/takasUygunluk";
import { SwapIcon, SearchLoupeIcon, ClipboardIcon, MessageIcon } from "@/components/icons";

export const metadata: Metadata = { title: "Takas Panelim", robots: { index: false } };

// Takas Panelim — takasla ilgili her şeyin tek sayfada toplandığı kişisel sayfa (Usta Panelim ile aynı
// düzen: sayfanın birincil eylemi en üstte, iki sayaç, dört kısayol). Önceden takas işleri dört yere
// dağınıktı: ilan açma/yönetme Garajım'daki araç kartlarında, mesajlar /mesajlar'da, kayıtlı aramalar
// /takas'ın içinde, engellenenler Profil'de.
//
// Bu sayfa YENİ mantık üretmez: durum bilgisi lib/takasUygunluk.ts'ten, ilan formu Garajım'dan gelir
// (formu buraya taşımıyoruz: araç bazlı ve büyük). Yalnızca takasla ilgisi olan üyeye açılır (garajında
// aracı olan ya da ilanı/görüşmesi olan); diğerleri tanıtım sayfasına gider.
export default async function TakasPanelimPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/giris?callbackUrl=%2Ftakas-panelim");
  const userId = Number(session.user.id);

  const [haritaSonucu, aktifIlan, toplamIlan, okunmamis, kayitliArama, konusma] = await Promise.all([
    takasUygunlukToplu(userId).catch(() => new Map<number, TakasAracUygunlugu>()),
    prisma.tradeListing.count({ where: { userId, isActive: true } }).catch(() => 0),
    prisma.tradeListing.count({ where: { userId } }).catch(() => 0),
    // api/messages/preview/route.ts'teki takas okunmamış sayımıyla AYNI — iki ayrı sayı göstermeyelim.
    prisma.message
      .count({
        where: { isRead: false, senderId: { not: userId }, thread: { OR: [{ initiatorId: userId }, { tradeListing: { userId } }] } },
      })
      .catch(() => 0),
    prisma.savedSearch.count({ where: { userId } }).catch(() => 0),
    prisma.messageThread.count({ where: { OR: [{ initiatorId: userId }, { tradeListing: { userId } }] } }).catch(() => 0),
  ]);

  const araclar = [...haritaSonucu.values()];
  const garajdaArac = araclar.some((a) => a.uygunluk.durum !== "GARAJDA_DEGIL");
  if (!garajdaArac && toplamIlan === 0 && konusma === 0) redirect("/takas-pazari-nasil-calisir");

  const acik = isTradeListingEnabled();
  const en = enIlerideArac(araclar);

  // Birincil eylem: hedefe en yakın araç için tek sıradaki iş.
  let aracAdi: string | null = null;
  let metin = "Takas ilanlarına göz atabilir, görüşmelerinizi ve kayıtlı aramalarınızı buradan yönetebilirsiniz.";
  let buton: { etiket: string; href: string } = { etiket: "Takas Pazarına göz atın", href: "/takas" };
  if (en) {
    aracAdi = stripGenRangeAnywhere(en.productName);
    const garajHref = `/garajim#arac-${en.userProductId}`;
    if (en.aktifIlanId != null) {
      metin = "İlanınız yayında. Düzenlemek, yenilemek veya kapatmak için Garajım'a gidin.";
      buton = { etiket: "İlanınızı yönetin", href: garajHref };
    } else if (en.uygunluk.uygun) {
      metin = "Gerekli adımlar tamamlandı. Aracınızı takasa açabilirsiniz.";
      buton = { etiket: "Aracınızı takasa açın", href: garajHref };
    } else {
      const sonraki = takasSonrakiAdim(en.uygunluk, en.productSlug);
      metin = `${sonraki.baslik}. ${sonraki.metin}`;
      // İncelemede bekleyen adımda buton yok: durumu Garajım'dan görmek yeterli.
      buton = sonraki.buton ?? { etiket: "Garajım'da durumu görün", href: garajHref };
    }
  }

  return (
    <div className="max-w-3xl w-full mx-auto px-4 py-10">
      <Link href="/" className="inline-flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-gray-800 mb-6">
        ← Ana sayfaya dön
      </Link>

      <div className="mb-8">
        <h1 className="text-2xl font-black text-gray-900">Takas Panelim</h1>
        <p className="text-sm text-gray-500 mt-1">
          İlanlarınızı, görüşmelerinizi ve kayıtlı aramalarınızı buradan takip edebilirsiniz.
        </p>
      </div>

      {/* Birincil eylem — kişinin şu an yapması gereken tek iş */}
      <section className="mb-8 bg-white border border-gray-100 rounded-2xl p-4 sm:p-5" aria-label="Sıradaki adım">
        {aracAdi && <p className="text-xs font-semibold text-gray-400 truncate">{aracAdi}</p>}
        <p className="text-sm text-gray-700 leading-relaxed mt-0.5">
          {acik || !en ? metin : "Takas Pazarı şu anda geçici olarak kullanılamıyor."}
        </p>
        {(acik || !en) && (
          <Link
            href={buton.href}
            className="mt-3 flex items-center justify-center gap-2 w-full sm:w-auto sm:inline-flex min-h-11 px-5 rounded-2xl text-sm font-semibold text-white"
            style={{ background: "var(--btn-dark)" }}
          >
            <SwapIcon size={16} className="text-white" />
            {buton.etiket} →
          </Link>
        )}
      </section>

      <div className="grid grid-cols-2 gap-4 mb-8 bg-gray-50 border border-gray-100 rounded-2xl p-5">
        <div className="text-center">
          <div className="text-2xl font-black text-gray-900">{aktifIlan}</div>
          <div className="text-xs text-gray-500 mt-0.5">Aktif ilan</div>
        </div>
        <div className="text-center">
          <div className={`text-2xl font-black ${okunmamis > 0 ? "text-red-600" : "text-gray-900"}`}>{okunmamis}</div>
          <div className="text-xs text-gray-500 mt-0.5">Okunmamış mesaj</div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <Link
          href="/garajim"
          className="flex items-center justify-center gap-2.5 px-3 py-3.5 rounded-2xl border border-gray-200 bg-white hover:border-[var(--pe)]/40 hover:shadow-sm transition-all text-sm font-semibold text-gray-900"
        >
          <span className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: "var(--pe-bg)" }}>
            <ClipboardIcon size={16} className="text-[var(--pe-color)]" />
          </span>
          İlanlarım
        </Link>
        <Link
          href="/mesajlar"
          className="flex items-center justify-center gap-2.5 px-3 py-3.5 rounded-2xl border border-gray-200 bg-white hover:border-[var(--ka)]/40 hover:shadow-sm transition-all text-sm font-semibold text-gray-900"
        >
          <span className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: "var(--ka-bg)" }}>
            <MessageIcon size={16} className="text-[var(--ka-color)]" />
          </span>
          <span className="min-w-0">Takas Mesajlarım</span>
        </Link>
        <Link
          href="/takas"
          className="flex items-center justify-center gap-2.5 px-3 py-3.5 rounded-2xl border border-gray-200 bg-white hover:border-[var(--fi)]/40 hover:shadow-sm transition-all text-sm font-semibold text-gray-900"
        >
          <span className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: "var(--fi-bg)" }}>
            <SearchLoupeIcon size={16} className="text-[var(--fi-color)]" />
          </span>
          <span className="min-w-0">
            Kayıtlı Aramalarım
            {kayitliArama > 0 && <span className="ml-1 text-xs font-normal text-gray-500">({kayitliArama})</span>}
          </span>
        </Link>
        <Link
          href="/takas"
          className="flex items-center justify-center gap-2.5 px-3 py-3.5 rounded-2xl border border-gray-200 bg-white hover:border-gray-400 hover:shadow-sm transition-all text-sm font-semibold text-gray-900"
        >
          <span className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-gray-100">
            <SwapIcon size={16} className="text-gray-600" />
          </span>
          <span className="min-w-0">Takas Pazarı</span>
        </Link>
      </div>

      <p className="text-xs text-gray-500 flex flex-wrap gap-x-4 gap-y-1">
        <Link href="/takas-pazari-nasil-calisir" className="hover:underline hover:text-gray-800">
          Takas nasıl çalışır?
        </Link>
        <Link href="/profil" className="hover:underline hover:text-gray-800">
          Engellenen kullanıcılar ve bildirim tercihleri
        </Link>
      </p>
    </div>
  );
}
