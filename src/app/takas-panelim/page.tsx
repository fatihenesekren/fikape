import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { isTradeListingEnabled } from "@/lib/features";
import { panelSiradakiIs } from "@/lib/takasUygunluk";
import { takasPanelKapisi } from "@/lib/takasPanelKapisi";
import { SwapIcon, SearchLoupeIcon, ClipboardIcon, MessageIcon } from "@/components/icons";

export const metadata: Metadata = { title: "Takas Panelim", robots: { index: false } };

// Takas Panelim — Usta Panelim ile AYNI iskelet: başlık, tek siyah birincil buton, iki sayaç, kısayol kartları; başka
// hiçbir blok yok. İlan yönetimi (düzenle/yenile/kapat) /takas-panelim/ilanlarim'da, kayıtlı aramalar
// /takas-panelim/aramalar'da; bu sayfa yalnızca "şimdi ne yapmalıyım" ve "durum ne" sorularını yanıtlar. Önceki sürümlerde
// aynı bilgi dört kez söyleniyor, alta dağınık linkler diziliyor ve iki kutucuk aynı adrese gidiyordu (5 ajanlı inceleme).
// "Ayarlar" butonu BİLEREK yok: Takas'ın kendi ayar sayfası yok, /profil genel hesap sayfası ve açılınca tüm bildirimler
// okundu oluyor (3 ajan: koyma).
export default async function TakasPanelimPage() {
  const kapi = await takasPanelKapisi("/takas-panelim", "panel");

  if (kapi.hata) {
    return (
      <div className="max-w-3xl w-full mx-auto px-4 py-10">
        <h1 className="text-2xl font-black text-gray-900">Takas Panelim</h1>
        <p className="mt-4 text-sm text-gray-700 bg-gray-50 border border-gray-100 rounded-2xl p-5" role="alert">
          Panel şu anda yüklenemedi. Lütfen sayfayı yenileyin; sorun sürerse biraz sonra tekrar deneyin.
        </p>
      </div>
    );
  }

  const { userId, araclar, kayitliArama } = kapi;
  const acik = isTradeListingEnabled();

  // api/messages/preview/route.ts'teki takas okunmamış sayımıyla AYNI (usta mesajları dahil değil).
  const okunmamis = await prisma.message
    .count({
      where: { isRead: false, senderId: { not: userId }, thread: { OR: [{ initiatorId: userId }, { tradeListing: { userId } }] } },
    })
    .catch(() => 0);

  const siradaki = panelSiradakiIs({ ozellikAcik: acik, okunmamis, araclar });
  const buton = siradaki?.buton ?? null;
  const yayindaki = araclar.filter((a) => a.aktifIlanId != null).length;
  const aracVar = araclar.length > 0;

  const kartSinifi =
    "flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-2.5 px-3 py-4 sm:py-3.5 rounded-2xl border border-gray-200 bg-white text-center sm:text-left hover:border-gray-400 hover:shadow-sm transition-all text-sm font-semibold text-gray-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2";
  const daire = "w-8 h-8 rounded-full flex items-center justify-center shrink-0";

  return (
    <div className="max-w-3xl w-full mx-auto px-4 py-10">
      <Link href="/" className="inline-flex items-center min-h-9 gap-1 text-xs font-semibold text-gray-500 hover:text-gray-800 mb-5">
        ← Ana sayfaya dön
      </Link>

      <div className="mb-8">
        <h1 className="text-2xl font-black text-gray-900">Takas Panelim</h1>
        <p className="text-sm text-gray-600 mt-1">İlanlarınızı, mesajlarınızı ve kayıtlı aramalarınızı yönetebilirsiniz.</p>
      </div>

      {/* Birincil eylem — YALNIZCA bir kısayol kartıyla çakışmayan gerçek bir eylem varken siyah buton; aksi halde aynı yerde
          tek satırlık durum cümlesi (buton ile kutucuk aynı adrese gitmesin, bilgi sayaçta tekrarlanmasın). */}
      {acik ? (
        buton ? (
          <div className="mb-8">
            <Link
              href={buton.href}
              className="flex items-center justify-center gap-2 w-full sm:w-auto sm:inline-flex min-h-11 px-5 py-3 rounded-2xl text-sm font-semibold text-white hover:bg-black transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
              style={{ background: "var(--btn-dark)", outlineColor: "var(--btn-dark)" }}
            >
              <SwapIcon size={16} className="text-white" />
              {buton.etiket} <span aria-hidden="true">→</span>
            </Link>
            {buton.altYazi && <p className="text-sm text-gray-600 mt-2">{buton.altYazi}</p>}
          </div>
        ) : (
          siradaki?.metin && (
            <p className="mb-8 text-sm text-gray-700 leading-relaxed bg-white border border-gray-100 rounded-2xl px-5 py-4">
              {siradaki.metin}
            </p>
          )
        )
      ) : (
        <p className="mb-8 text-sm text-gray-700 bg-gray-50 border border-gray-100 rounded-2xl p-5">
          Takas Pazarı şu anda geçici olarak kullanılamıyor. Özellik yeniden açıldığında ilanlarınızı buradan yönetebilirsiniz.
        </p>
      )}

      {/* İki sayaç — Usta Panelim ile aynı kutu; tıklanmaz */}
      <dl className="grid grid-cols-2 gap-4 mb-8 bg-gray-50 border border-gray-100 rounded-2xl p-5 text-center">
        <div className="flex flex-col-reverse">
          <dt className="text-xs text-gray-600 mt-0.5">Yayındaki ilan</dt>
          <dd className="text-2xl font-black text-gray-900 tabular-nums">{yayindaki}</dd>
        </div>
        <div className="flex flex-col-reverse">
          <dt className="text-xs text-gray-600 mt-0.5">Okunmamış takas mesajı</dt>
          <dd className={`text-2xl font-black tabular-nums ${okunmamis > 0 ? "text-red-700" : "text-gray-900"}`}>
            {okunmamis}
            {okunmamis > 0 && <span className="ml-1.5 align-middle text-[11px] font-bold">Yeni</span>}
          </dd>
        </div>
      </dl>

      {/* Kısayollar — her hedef bir kez, aynı adrese giden iki kart yok */}
      <nav aria-label="Takas kısayolları">
        <ul className={`grid grid-cols-2 ${aracVar ? "sm:grid-cols-4" : "sm:grid-cols-2"} gap-3`}>
          {aracVar && (
            <li>
              <Link href="/takas-panelim/ilanlarim" className={kartSinifi} style={{ outlineColor: "var(--link)" }}>
                <span className={daire} style={{ background: "var(--pe-bg)" }}>
                  <ClipboardIcon size={16} className="text-[var(--pe-color)]" />
                </span>
                <span className="min-w-0">İlanlarım</span>
              </Link>
            </li>
          )}
          <li>
            <Link href="/mesajlar" className={kartSinifi} style={{ outlineColor: "var(--link)" }}>
              <span className={daire} style={{ background: "var(--ka-bg)" }}>
                <MessageIcon size={16} className="text-[var(--ka-color)]" />
              </span>
              <span className="min-w-0">Takas Mesajlarım</span>
            </Link>
          </li>
          <li>
            <Link href="/takas-panelim/aramalar" className={kartSinifi} style={{ outlineColor: "var(--link)" }}>
              <span className={daire} style={{ background: "var(--fi-bg)" }}>
                <SearchLoupeIcon size={16} className="text-[var(--fi-color)]" />
              </span>
              <span className="min-w-0">
                Kayıtlı Aramalarım
                {kayitliArama > 0 && (
                  <>
                    {" "}
                    <span className="font-normal text-gray-600" aria-hidden="true">({kayitliArama})</span>
                    <span className="sr-only">, {kayitliArama} kayıtlı arama</span>
                  </>
                )}
              </span>
            </Link>
          </li>
          {aracVar && (
            <li>
              <Link href="/takas" className={kartSinifi} style={{ outlineColor: "var(--link)" }}>
                <span className={`${daire} bg-gray-100`}>
                  <SwapIcon size={16} className="text-gray-600" />
                </span>
                <span className="min-w-0">Takas Pazarı</span>
              </Link>
            </li>
          )}
        </ul>
      </nav>
    </div>
  );
}
