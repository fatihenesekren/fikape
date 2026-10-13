import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isTradeListingEnabled } from "@/lib/features";
import { stripGenRangeAnywhere } from "@/lib/modelDisplay";
import {
  takasUygunlukToplu, enIlerideArac, aracOnceligi, takasSonrakiAdim,
} from "@/lib/takasUygunluk";
import { takasIlanFormVerisi } from "@/lib/takasIlanVerisi";
import { TradeToggleCard } from "@/app/garajim/TradeToggleCard";
import { TakasSartKarti } from "@/app/garajim/TakasSartKarti";
import { SwapIcon, SearchLoupeIcon, MessageIcon } from "@/components/icons";

export const metadata: Metadata = { title: "Takas Panelim", robots: { index: false } };

// Takas Panelim — takasla ilgili her şeyin tek sayfada toplandığı kişisel sayfa. Düzen yukarıdan aşağıya:
// (1) sıradaki tek iş, (2) mesaj ve kayıtlı arama durumu (tıklanabilir iki kart), (3) araçlarım: her araç için
// ilan kartı ya da şart kartı, (4) ikincil bağlantılar. Önceden aynı bilgi dört kez söyleniyordu (kutu, sayaç,
// bölüm başlığı, kart), "ilanınızı yönetin" düğmesi aynı sayfadaki bölüme çıpa veriyordu, iki kısayol aynı
// adrese gidiyordu ve şartı eksik araçlar listeden düşüyordu (bkz. 5 ajanlı inceleme).
//
// Bu sayfa YENİ mantık üretmez: durum bilgisi lib/takasUygunluk.ts'ten, ilan formu Garajım'daki kartın aynısı
// (TradeToggleCard). Yalnızca takasla ilgisi olan üyeye açılır; diğerleri tanıtım sayfasına gider.

function Rozet({ ton, children }: { ton: "mavi" | "yesil" | "gri" | "amber"; children: React.ReactNode }) {
  const sinif = {
    mavi: "bg-link-soft text-link-deep border-link-line",
    yesil: "bg-[var(--ka-bg)] text-[var(--ka-color)] border-transparent",
    gri: "bg-gray-100 text-gray-700 border-gray-200",
    amber: "bg-amber-50 text-amber-800 border-amber-100",
  }[ton];
  return <span className={`shrink-0 inline-flex items-center text-xs font-semibold rounded-full border px-2.5 py-1 ${sinif}`}>{children}</span>;
}

export default async function TakasPanelimPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/giris?callbackUrl=%2Ftakas-panelim");
  const userId = Number(session.user.id);

  const [haritaSonucu, toplamIlan, okunmamis, kayitliArama, konusma] = await Promise.all([
    takasUygunlukToplu(userId).catch(() => null),
    prisma.tradeListing.count({ where: { userId } }).catch(() => null),
    // api/messages/preview/route.ts'teki takas okunmamış sayımıyla AYNI (usta mesajları dahil değil).
    prisma.message
      .count({
        where: { isRead: false, senderId: { not: userId }, thread: { OR: [{ initiatorId: userId }, { tradeListing: { userId } }] } },
      })
      .catch(() => 0),
    prisma.savedSearch.count({ where: { userId } }).catch(() => 0),
    prisma.messageThread
      .findFirst({ where: { OR: [{ initiatorId: userId }, { tradeListing: { userId } }] }, select: { id: true } })
      .catch(() => null),
  ]);

  // Veri okunamadıysa kullanıcıyı sessizce tanıtım sayfasına atmak yerine hatayı söyleriz.
  if (haritaSonucu === null || toplamIlan === null) {
    return (
      <div className="max-w-3xl w-full mx-auto px-4 py-10">
        <h1 className="text-2xl sm:text-3xl font-black text-gray-900">Takas Panelim</h1>
        <p className="mt-4 text-sm text-gray-700 bg-gray-50 border border-gray-100 rounded-2xl p-5" role="alert">
          Panel şu anda yüklenemedi. Lütfen sayfayı yenileyin; sorun sürerse biraz sonra tekrar deneyin.
        </p>
      </div>
    );
  }

  const garajdakiler = [...haritaSonucu.values()].filter((a) => a.uygunluk.durum !== "GARAJDA_DEGIL");
  if (garajdakiler.length === 0 && toplamIlan === 0 && !konusma && kayitliArama === 0) {
    redirect("/takas-pazari-nasil-calisir");
  }

  const acik = isTradeListingEnabled();
  const araclar = [...garajdakiler].sort((x, y) => aracOnceligi(x) - aracOnceligi(y));

  // İlan kartı (TradeToggleCard) yalnızca ilanı olan ya da takasa hazır araçlarda; kategori/marka/ilan verisi
  // yalnızca gerçekten kart varsa yüklenir.
  const kartGerekli = acik && araclar.some((a) => a.aktifIlanId != null || a.uygunluk.uygun);
  const kartVerisi = kartGerekli ? await takasIlanFormVerisi(userId) : null;

  // ── (1) Sıradaki tek iş ──────────────────────────────────────────────────────────
  type Siradaki = { etiket: string | null; baslik: string; metin: string; buton: { etiket: string; href: string } | null; ikincil?: boolean };
  let siradaki: Siradaki;
  const en = enIlerideArac(araclar);
  if (okunmamis > 0) {
    siradaki = {
      etiket: null,
      baslik: `${okunmamis} yeni mesajınız var`,
      metin: "Takas görüşmelerinizde yanıt bekleyen mesajlar var.",
      buton: { etiket: "Mesajları okuyun", href: "/mesajlar" },
    };
  } else if (en) {
    const adi = stripGenRangeAnywhere(en.productName);
    const kapaliIlan = kartVerisi?.listingByUserProductId.get(en.userProductId);
    if (en.aktifIlanId != null) {
      siradaki = {
        etiket: adi, baslik: "İlanınız yayında", metin: "Yeni bir mesaj geldiğinde burada ve bildirimlerinizde görürsünüz.",
        buton: { etiket: "İlanı görüntüleyin", href: `/takas/${en.aktifIlanId}` }, ikincil: true,
      };
    } else if (en.uygunluk.uygun) {
      siradaki = {
        etiket: adi,
        baslik: kapaliIlan && !kapaliIlan.isActive ? "Kapalı ilanınızı yeniden açabilirsiniz" : "Aracınızı takasa açabilirsiniz",
        metin: "Gerekli adımlar tamamlandı. Aşağıdaki araç kartından ilanınızı oluşturabilirsiniz.",
        buton: { etiket: kapaliIlan && !kapaliIlan.isActive ? "İlanı yeniden açın" : "Aracınızı takasa açın", href: `#arac-${en.userProductId}` },
      };
    } else {
      const sonraki = takasSonrakiAdim(en.uygunluk, en.productSlug);
      siradaki = { etiket: adi, baslik: sonraki.baslik, metin: sonraki.metin, buton: sonraki.buton };
    }
  } else {
    siradaki = {
      etiket: null, baslik: "Takas ilanlarına göz atın",
      metin: "Aracınızı takasa açmak için önce garajınıza bir araç ekleyip şartları tamamlayabilirsiniz.",
      buton: { etiket: "Takas Pazarına göz atın", href: "/takas" },
    };
  }

  return (
    <div className="max-w-3xl w-full mx-auto px-4 py-10 space-y-8">
      <div>
        <Link href="/" className="inline-flex items-center min-h-9 text-sm font-semibold text-gray-600 hover:text-gray-900">
          ← Ana sayfaya dön
        </Link>
        <h1 className="mt-2 text-2xl sm:text-3xl font-black tracking-tight text-gray-900">Takas Panelim</h1>
        <p className="mt-1.5 text-sm sm:text-base text-gray-600 leading-relaxed">
          İlanlarınızı, mesajlarınızı ve kayıtlı aramalarınızı buradan yönetebilirsiniz.
        </p>
      </div>

      {/* (1) Sıradaki adım */}
      <section aria-labelledby="siradaki-baslik" className="bg-white border border-gray-100 rounded-2xl p-5 sm:p-6">
        {acik ? (
          <>
            {siradaki.etiket && <p className="text-sm font-bold text-gray-900 truncate">{siradaki.etiket}</p>}
            <h2 id="siradaki-baslik" className="text-base font-bold text-gray-900 mt-0.5">{siradaki.baslik}</h2>
            <p className="text-sm text-gray-600 leading-relaxed mt-1">{siradaki.metin}</p>
            {siradaki.buton && (
              <Link
                href={siradaki.buton.href}
                className={
                  siradaki.ikincil
                    ? "mt-4 inline-flex w-full sm:w-auto items-center justify-center gap-2 min-h-11 px-5 rounded-xl text-sm font-semibold border border-link-line bg-link-soft text-link-deep transition-colors hover:bg-[#D4E6F8] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                    : "mt-4 inline-flex w-full sm:w-auto items-center justify-center gap-2 min-h-11 px-5 rounded-xl text-sm font-semibold text-white transition-colors hover:bg-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                }
                style={siradaki.ikincil ? { outlineColor: "var(--link)" } : { background: "var(--btn-dark)", outlineColor: "var(--btn-dark)" }}
              >
                <SwapIcon size={16} />
                {siradaki.buton.etiket}
              </Link>
            )}
          </>
        ) : (
          <>
            <h2 id="siradaki-baslik" className="text-base font-bold text-gray-900">Takas Pazarı geçici olarak kullanılamıyor</h2>
            <p className="text-sm text-gray-600 leading-relaxed mt-1">
              Özellik yeniden açıldığında ilanlarınızı buradan yönetmeye devam edebilirsiniz.
            </p>
          </>
        )}
      </section>

      {/* (2) Mesajlar ve kayıtlı aramalar — sayı ve eylem aynı kartta */}
      <section aria-label="Mesajlar ve kayıtlı aramalar" className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Link
          href="/mesajlar"
          className="group flex flex-col gap-3 rounded-2xl border border-gray-100 bg-white p-4 sm:p-5 transition-all hover:border-gray-300 hover:shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
          style={{ outlineColor: "var(--link)" }}
        >
          <span className="flex items-center justify-between gap-3">
            <span className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: "var(--ka-bg)" }}>
              <MessageIcon size={18} className="text-[var(--ka-color)]" />
            </span>
            <span className="flex items-baseline gap-2">
              <span className="text-3xl font-black tabular-nums text-gray-900">{okunmamis}</span>
              {okunmamis > 0 && <span className="text-xs font-bold text-red-700">Yeni</span>}
            </span>
          </span>
          <span>
            <span className="block text-sm font-semibold text-gray-900">Okunmamış takas mesajı</span>
            <span className="block text-sm font-semibold text-link group-hover:text-link-deep mt-0.5">Mesajlarım →</span>
          </span>
        </Link>

        <Link
          href={kayitliArama > 0 ? "/takas?aramalar=1#kayitli-aramalar" : "/takas"}
          className="group flex flex-col gap-3 rounded-2xl border border-gray-100 bg-white p-4 sm:p-5 transition-all hover:border-gray-300 hover:shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
          style={{ outlineColor: "var(--link)" }}
        >
          <span className="flex items-center justify-between gap-3">
            <span className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: "var(--fi-bg)" }}>
              <SearchLoupeIcon size={18} className="text-[var(--fi-color)]" />
            </span>
            <span className="text-3xl font-black tabular-nums text-gray-900">{kayitliArama}</span>
          </span>
          <span>
            <span className="block text-sm font-semibold text-gray-900">Kayıtlı arama</span>
            <span className="block text-sm font-semibold text-link group-hover:text-link-deep mt-0.5">
              {kayitliArama > 0 ? "Aramalarımı yönet →" : "Takas Pazarında arama kaydedin →"}
            </span>
          </span>
        </Link>
      </section>

      {/* (3) Araçlarım — her araç için ilan kartı ya da şart kartı */}
      {acik && araclar.length > 0 && (
        <section aria-labelledby="araclarim-baslik">
          <div className="flex items-center justify-between gap-3 mb-3">
            <h2 id="araclarim-baslik" className="text-base font-bold text-gray-900">Araçlarım</h2>
            <Link href="/takas" className="inline-flex items-center min-h-9 text-sm font-semibold text-link hover:text-link-deep hover:underline">
              Takas Pazarına göz atın →
            </Link>
          </div>
          <div className="space-y-4">
            {araclar.map((a) => {
              const detay = kartVerisi?.listingByUserProductId.get(a.userProductId) ?? null;
              const kartVar = a.aktifIlanId != null || a.uygunluk.uygun;
              return (
                <article
                  key={a.userProductId}
                  id={`arac-${a.userProductId}`}
                  className="bg-white border border-gray-100 rounded-2xl p-4 sm:p-5 scroll-mt-20"
                >
                  <header className="flex items-start justify-between gap-3">
                    <h3 className="text-base font-bold text-gray-900 min-w-0 break-words">{stripGenRangeAnywhere(a.productName)}</h3>
                    {a.aktifIlanId != null ? (
                      <Rozet ton="mavi">Yayında</Rozet>
                    ) : a.uygunluk.uygun ? (
                      detay && !detay.isActive ? <Rozet ton="gri">Kapalı</Rozet> : <Rozet ton="yesil">Takasa hazır</Rozet>
                    ) : (
                      <Rozet ton="amber">Şartlar eksik</Rozet>
                    )}
                  </header>
                  {kartVar && kartVerisi ? (
                    <TradeToggleCard
                      userProductId={a.userProductId}
                      canOpenTrade={a.uygunluk.uygun}
                      takasAcik={acik}
                      sart={{ adimlar: a.uygunluk.adimlar, sonraki: takasSonrakiAdim(a.uygunluk, a.productSlug) }}
                      categories={kartVerisi.categories}
                      brands={kartVerisi.brands}
                      categoryBrandMap={kartVerisi.categoryBrandMap}
                      existingListing={detay}
                      currentUsageAmount={a.km}
                      productSlug={a.productSlug}
                      categorySlug={a.categorySlug}
                      baslangicAcik={a.aktifIlanId != null}
                    />
                  ) : (
                    <TakasSartKarti adimlar={a.uygunluk.adimlar} sonraki={takasSonrakiAdim(a.uygunluk, a.productSlug)} />
                  )}
                </article>
              );
            })}
          </div>
        </section>
      )}

      {/* (4) İkincil bağlantılar */}
      <nav aria-label="Diğer bağlantılar" className="border-t border-gray-100 pt-5 flex flex-wrap gap-x-5 gap-y-1 text-sm">
        {[
          { href: "/takas", etiket: "Takas Pazarı" },
          { href: "/garajim", etiket: "Garajım" },
          { href: "/takas-pazari-nasil-calisir", etiket: "Takas nasıl çalışır?" },
          { href: "/profil", etiket: "Engellenenler ve bildirimler" },
        ].map((l) => (
          <Link key={l.href} href={l.href} className="inline-flex items-center min-h-9 font-semibold text-link hover:text-link-deep hover:underline">
            {l.etiket}
          </Link>
        ))}
      </nav>
    </div>
  );
}
