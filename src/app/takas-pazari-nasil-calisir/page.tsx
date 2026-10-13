import Link from "next/link";
import type { Metadata } from "next";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isTradeListingEnabled } from "@/lib/features";
import { JsonLd } from "@/components/JsonLd";
import {
  TAKAS_SAYFA_BASLIK, TAKAS_SAYFA_ACIKLAMA, TAKAS_GIRIS_METNI, TAKAS_ADIMLAR, TAKAS_ADIMLAR_BASLIK,
  TAKAS_KAPANIS_BASLIK, TAKAS_KAPANIS_METNI, TAKAS_SSS_BASLIK,
  TAKAS_NEDEN_BASLIK, TAKAS_NEDEN_METNI, TAKAS_GORUNUR_BASLIK, TAKAS_GORUNUR,
  TAKAS_GUVENLIK_BASLIK, TAKAS_GUVENLIK, TAKAS_SORUMLULUK, TAKAS_SSS,
} from "./icerik";

// Takas Pazarı tanıtım/şart sayfası. Herkese açık; dış görünüm kalıbı /usta-ol ile aynı
// (tek sütun, numaralı adımlar, <details> SSS, alt buton) ama içerik ve buton Takas'a özgü:
// buton ziyaretçinin durumuna göre değişir (misafir / aracı yok / aracı var).
export const metadata: Metadata = {
  alternates: { canonical: "/takas-pazari-nasil-calisir" },
  title: TAKAS_SAYFA_BASLIK,
  description: TAKAS_SAYFA_ACIKLAMA,
  openGraph: {
    title: TAKAS_SAYFA_BASLIK,
    description: TAKAS_SAYFA_ACIKLAMA,
    // openGraph tanımlayınca kökteki opengraph-image miras alınmaz; açıkça verilir
    images: [{ url: "/opengraph-image" }],
  },
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: TAKAS_SSS.map((s) => ({
    "@type": "Question",
    name: s.q,
    acceptedAnswer: { "@type": "Answer", text: s.a },
  })),
};

type Cta = { etiket: string; href: string };

function CtaBlok({ cta, acik, ilanVar, ust, ipucu }: { cta: Cta; acik: boolean; ilanVar: boolean; ust?: boolean; ipucu?: string | null }) {
  if (!acik) {
    return (
      <p className="text-sm text-gray-600 bg-gray-50 rounded-xl px-4 py-3">
        Takas Pazarı şu anda geçici olarak kullanılamıyor.
      </p>
    );
  }
  return (
    <div className={ust ? "" : "text-center"}>
      <Link
        href={cta.href}
        className="inline-flex items-center justify-center min-h-11 px-6 rounded-xl text-sm font-semibold text-white"
        style={{ background: "var(--btn-dark)" }}
      >
        {cta.etiket} <span aria-hidden="true">→</span>
      </Link>
      {ipucu && <p className="mt-2 text-sm text-gray-600">{ipucu}</p>}
      {ilanVar ? (
        <p className="mt-1">
          <Link href="/takas" className="inline-flex items-center min-h-11 text-sm font-semibold text-link hover:underline">
            Takas ilanlarına göz atın
          </Link>
        </p>
      ) : (
        !ust && <p className="mt-3 text-sm text-gray-600">Şu anda yayında ilan yok.</p>
      )}
    </div>
  );
}

export default async function TakasPazariNasilCalisirPage() {
  const session = await auth();
  const userId = session?.user?.id ? Number(session.user.id) : null;

  const [aracKaydi, ilanKaydi] = await Promise.all([
    userId
      ? prisma.userProduct.findFirst({ where: { userId, ownershipStatus: "CURRENT" }, select: { id: true } }).catch(() => null)
      : null,
    prisma.tradeListing.findFirst({ where: { isActive: true }, select: { id: true } }).catch(() => null),
  ]);
  const acik = isTradeListingEnabled();
  const ilanVar = ilanKaydi != null;

  // Ziyaretçi durumuna göre tek buton: misafir → giriş, aracı yok → araç ekle, aracı var → panel.
  const cta: Cta = !userId
    ? { etiket: "Giriş yapın", href: "/giris?callbackUrl=%2Ftakas-pazari-nasil-calisir" }
    : !aracKaydi
    ? { etiket: "Aracınızı garajınıza ekleyin", href: "/araclar" }
    : { etiket: "Takas Panelim'e gidin", href: "/takas-panelim" };
  const ipucu = !userId ? null : !aracKaydi ? "Araç sayfasında “Bu araç benim” butonuna basarak aracınızı garajınıza ekleyin." : "Panelde aracınız için sıradaki adım gösterilir.";

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <JsonLd data={faqJsonLd} />

      <Link href="/" className="inline-flex items-center min-h-11 text-sm text-gray-600 hover:text-[var(--link)] transition-colors">
        ← Ana sayfaya dön
      </Link>

      <div className="w-10 h-1 rounded-full mt-2 mb-3" style={{ background: "var(--fi-strong)" }} />
      <h1 className="text-3xl sm:text-4xl font-black text-gray-900 mb-3 leading-tight">{TAKAS_SAYFA_BASLIK}</h1>
      <p className="text-base text-gray-700 leading-relaxed mb-5">{TAKAS_GIRIS_METNI}</p>
      <div className="mb-10">
        <CtaBlok cta={cta} acik={acik} ilanVar={ilanVar} ust ipucu={ipucu} />
      </div>

      {/* Adımlar — numaralı zaman çizelgesi */}
      <section className="mb-10" aria-labelledby="adimlar">
        <h2 id="adimlar" className="text-lg font-bold text-gray-900 mb-4">{TAKAS_ADIMLAR_BASLIK}</h2>
        <ol className="space-y-0">
          {TAKAS_ADIMLAR.map((s, i) => (
            <li key={s.baslik} className="flex gap-3">
              <div className="flex flex-col items-center shrink-0">
                <span
                  className="flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold"
                  style={{ background: "var(--link-soft)", color: "var(--link)" }}
                >
                  {i + 1}
                </span>
                {i < TAKAS_ADIMLAR.length - 1 && <span className="w-px flex-1 bg-gray-200 my-1" aria-hidden="true" />}
              </div>
              <div className="pb-5 min-w-0">
                <p className="text-sm font-semibold text-gray-900">{s.baslik}</p>
                <p className="text-sm text-gray-600 leading-relaxed mt-0.5">{s.metin}</p>
                {s.baglanti && (
                  <Link href={s.baglanti.href} className="inline-flex items-center min-h-11 text-sm font-semibold text-link hover:underline">
                    {s.baglanti.etiket}
                  </Link>
                )}
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="mb-10 bg-link-soft/60 border border-link-line rounded-2xl p-4 sm:p-5">
        <h2 className="text-base font-bold text-link-deep mb-1.5">{TAKAS_NEDEN_BASLIK}</h2>
        <p className="text-sm text-gray-700 leading-relaxed">{TAKAS_NEDEN_METNI}</p>
      </section>

      <section className="mb-10" aria-labelledby="gorunur">
        <h2 id="gorunur" className="text-lg font-bold text-gray-900 mb-3">{TAKAS_GORUNUR_BASLIK}</h2>
        <ul className="space-y-2.5">
          {TAKAS_GORUNUR.map((m) => (
            <li key={m} className="flex items-start gap-2.5 text-sm text-gray-700 leading-relaxed min-w-0">
              <span aria-hidden="true" className="mt-1.5 w-1.5 h-1.5 rounded-full bg-gray-300 shrink-0" />
              <span className="min-w-0 break-words">{m}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mb-10" aria-labelledby="kapanis">
        <h2 id="kapanis" className="text-lg font-bold text-gray-900 mb-2">{TAKAS_KAPANIS_BASLIK}</h2>
        <p className="text-sm text-gray-700 leading-relaxed">{TAKAS_KAPANIS_METNI}</p>
      </section>

      <section className="mb-10 bg-amber-50 border border-amber-100 rounded-2xl p-4 sm:p-5">
        <h2 className="text-base font-bold text-amber-900 mb-2">
          {TAKAS_GUVENLIK_BASLIK}
        </h2>
        <ul className="space-y-1.5 list-disc pl-5 text-sm text-amber-900 leading-relaxed">
          {TAKAS_GUVENLIK.map((m) => (
            <li key={m}>{m}</li>
          ))}
        </ul>
        <p className="mt-3 text-sm text-amber-900 leading-relaxed break-words">
          {TAKAS_SORUMLULUK}{" "}
          <Link href="/kullanim-kosullari#madde-10" className="underline underline-offset-2">
            Kullanım Koşulları
          </Link>
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-lg font-bold text-gray-900 mb-2">{TAKAS_SSS_BASLIK}</h2>
        <div>
          {TAKAS_SSS.map((f) => (
            <details key={f.q} className="group border-b border-gray-100">
              <summary
                className="flex cursor-pointer items-center justify-between gap-3 min-h-11 py-3 text-sm font-semibold text-gray-900 list-none [&::-webkit-details-marker]:hidden focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                style={{ outlineColor: "var(--link)" }}
              >
                {f.q}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="shrink-0 transition-transform duration-200 group-open:rotate-180" aria-hidden="true">
                  <path d="M6 9l6 6 6-6" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </summary>
              <p className="text-sm text-gray-600 leading-relaxed pb-3.5">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      <div className="mb-8">
        <CtaBlok cta={cta} acik={acik} ilanVar={ilanVar} ipucu={ipucu} />
      </div>
    </div>
  );
}
