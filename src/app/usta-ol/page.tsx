import Link from "next/link";
import type { Metadata } from "next";

// Herkese açık, login gerektirmeyen tanıtım sayfası — /usta-basvuru'ya (login
// gerektiren, gerçek form) dokunmadan ayrı tutuldu (bkz. feature_usta_gorusleri_ilerleme.md,
// 13 Eylül 2026 teknik ajan kararı). Metin 5 uzman ajan paneliyle geliştirildi,
// kurucu onayladı — bkz. docs/usta-basvuru-tanitim-metni.md. Görsel/yapısal
// tasarım 3 uzman ajan (Görsel, Etkileşim/Akordiyon, İçerik Hiyerarşisi)
// paneliyle 13 Eylül 2026'da yeniden düzenlendi: ikon+flex kart deseni
// (native list yerine), marka renklerinin (fi/ka/pe/link) noktasal kullanımı,
// SSS native <details>/<summary> akordiyonu, "Bilmeniz gerekenler" içeriği
// SSS'e dağıtıldı + CTA'dan hemen önceki caydırıcı konumdan kaldırıldı.
export const metadata: Metadata = {
  title: "Usta Ol, Ücretsiz İlan Ver — Oto Tamircisi Profili",
  description:
    "Araç tamiri/bakımı konusunda deneyimliyseniz fikape'de ücretsiz usta profili oluşturun, teknik bilginizi paylaşın. Sertifika şartı yok.",
  openGraph: {
    title: "Aracı iyi bilen biri misin? fikape'de Usta Ol",
    description:
      "Tamirini, bakımını yıllardır yaptığın araçlar hakkında bildiklerini paylaş; profilin binlerce araç sahibine görünsün. Sertifika gerekmez, ücretsiz.",
  },
};

const BENEFITS = [
  { tint: "var(--fi-bg)", dot: "var(--fi-strong)", title: "Kendi tanıtım sayfanız", body: "Uzmanlık alanlarınız, yazdığınız notlar, isterseniz iletişim bilgileriniz tek sayfada." },
  { tint: "var(--ka-bg)", dot: "var(--ka-strong)", title: "Görünürlük", body: "Yazdığınız not, o modele bakan her kullanıcının karşısına çıkar; bulunduğunuz ildeki araç sahiplerine ulaşırsınız." },
  { tint: "var(--pe-bg)", dot: "var(--pe-strong)", title: "İsteğe bağlı iletişim", body: "Telefon/iş yeri adresinizi paylaşmayı seçerseniz, ilk notunuz yayınlandıktan sonra size ulaşmak isteyenler bunu görebilir." },
  { tint: "var(--fi-bg)", dot: "var(--fi-strong)", title: "Şu an için ücretsiz", body: "fikape bu özellik için sizden ücret almaz." },
  { tint: "var(--ka-bg)", dot: "var(--ka-strong)", title: "Yazmanız uzun sürmez", body: "Tek bir modelle ilgili bildiklerinizi birkaç cümleyle paylaşmanız yeterli." },
] as const;

const STEPS = [
  { title: "Kısa bir form doldurun", body: "~3 dakika: uzmanlık alanlarınız, iliniz, kendinizi anlatan bir metin." },
  { title: "Başvurunuzu inceleriz", body: "Genellikle birkaç iş günü içinde — kimlik veya belge istemeyiz, yalnızca anlattıklarınızın tutarlı olup olmadığına bakarız." },
  { title: "İlk notunuzu yazın", body: "Başvurunuz kabul edilirse bir model hakkında bildiklerinizi paylaşırsınız." },
  { title: "Görünür olun", body: "Not yayınlandıktan sonra profiliniz, paylaşmayı seçtiyseniz iletişim bilgileriniz de bu noktadan itibaren görünür olur." },
] as const;

const FAQS = [
  { q: "Sertifika/belge gerekiyor mu?", a: "Hayır, anlattıklarınız yeterli. fikape kimlik veya meslek belgesi doğrulaması yapmaz — başvurunuz kendi anlattıklarınıza dayanır." },
  { q: "Ücretli mi?", a: "Şu an için hayır, ücretsizdir." },
  { q: "İletişim bilgimi paylaşmak zorunda mıyım?", a: "Hayır, isteğe bağlı — paylaşmasanız da kullanıcılar site üzerinden mesaj gönderebilir." },
  { q: "Galerici/yetkili servis çalışanıysam olur mu?", a: "Hayır, bu program bağımsız ustalar içindir." },
  { q: "Başvurum reddedilirse ne olur?", a: "Nedeniyle birlikte haber veririz; tekrar başvurabilirsiniz." },
  { q: "Kişisel bilgilerim nasıl kullanılır, fikape bir garanti veriyor mu?", a: "Başvurunuzda paylaştığınız bilgiler Gizlilik Politikamıza göre işlenir. fikape, sizinle kullanıcılar arasındaki hizmet ilişkisinin tarafı değildir ve garanti vermez; paylaştığınız bilginin doğruluğundan siz sorumlusunuz — yanıltıcı içerik \"Usta\" statünüzün sonlandırılmasına yol açar." },
] as const;

function CheckDot({ color }: { color: string }) {
  return (
    <span className="flex items-center justify-center w-5 h-5 rounded-full shrink-0 mt-0.5" style={{ background: color }}>
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M5 13l4 4L19 7" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

function XDot() {
  return (
    <span className="flex items-center justify-center w-5 h-5 rounded-full shrink-0 mt-0.5 bg-gray-200">
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M6 6l12 12M18 6L6 18" stroke="#6B7280" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    </span>
  );
}

export default function UstaOlPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <Link href="/" className="text-sm text-gray-500 hover:text-[var(--link)] transition-colors">
        ← Ana sayfaya dön
      </Link>

      <div className="w-10 h-1 rounded-full mt-5 mb-3" style={{ background: "var(--fi-strong)" }} />
      <h1 className="text-3xl sm:text-4xl font-black text-gray-900 mb-3 leading-tight">
        Usta Görüşleri&apos;ne Katılın
      </h1>
      <p className="text-base text-gray-700 leading-relaxed mb-1.5">
        <strong>Bir aracı yıllarca tamir etmiş veya bakımını yapmış biri misiniz?</strong>{" "}
        Bildikleriniz, o modeli almayı düşünen kullanıcılar için değerli. fikape&apos;de bunu paylaşarak
        hem topluluğa katkı sağlayın hem de kendi adınızla tanınır olun.
      </p>
      <p className="text-sm text-gray-500 leading-relaxed mb-8">
        Usta Görüşleri, ustaların gönüllü teknik katkısıdır — fikape bunu bir hizmet olarak satmaz,
        bilginizi paylaşmanıza aracılık eder.
      </p>

      {/* ── Bundan ne kazanırsınız — ikonlu kart grid ── */}
      <section className="mb-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Bundan ne kazanırsınız?</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {BENEFITS.map((b) => (
            <div key={b.title} className="bg-white border border-gray-100 rounded-2xl p-4 flex items-start gap-3">
              <CheckDot color={b.dot} />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900">{b.title}</p>
                <p className="text-xs text-gray-500 leading-relaxed mt-0.5">{b.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="text-center mb-10">
        <Link
          href="/usta-basvuru"
          className="inline-flex items-center gap-1.5 text-sm font-semibold rounded-full px-5 py-2.5 border transition-colors hover:bg-gray-50"
          style={{ color: "var(--link)", borderColor: "var(--link-line)" }}
        >
          Başvuruya geç →
        </Link>
      </div>

      {/* ── Kimler başvurabilir — olumlu/olumsuz karşılaştırma ── */}
      <section className="mb-10">
        <h2 className="text-lg font-bold text-gray-900 mb-1">Kimler başvurabilir?</h2>
        <p className="text-sm text-gray-600 leading-relaxed mb-4">
          Araçları gerçekten tamir eden, bakımını yapan herkes — sertifika şartı yoktur, anlattıklarınız
          yeterli. <strong>Bir işletmeniz/dükkânınız olması gerekmez</strong> — kendi aracınıza veya
          çevrenizdekilerin araçlarına yıllarca bakmış, bu konuda gerçekten bilgili biriyseniz de
          başvurabilirsiniz.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="rounded-2xl p-4 border" style={{ background: "var(--ka-bg)", borderColor: "var(--ka-soft)" }}>
            <p className="text-sm font-semibold mb-2.5" style={{ color: "var(--ka-strong)" }}>Başvurabilirsiniz</p>
            <ul className="space-y-2">
              <li className="flex items-start gap-2 text-sm text-gray-700"><CheckDot color="var(--ka-strong)" /> Gerçekten tamir/bakım yapan herkes</li>
              <li className="flex items-start gap-2 text-sm text-gray-700"><CheckDot color="var(--ka-strong)" /> İşletmesi olmayan, hobi amaçlı bilgili kişiler</li>
              <li className="flex items-start gap-2 text-sm text-gray-700"><CheckDot color="var(--ka-strong)" /> 18 yaşından büyükler</li>
            </ul>
          </div>
          <div className="rounded-2xl p-4 border border-gray-200 bg-gray-50">
            <p className="text-sm font-semibold text-gray-600 mb-2.5">Başvuramazsınız</p>
            <ul className="space-y-2">
              <li className="flex items-start gap-2 text-sm text-gray-600"><XDot /> Galeri/oto pazarlama işletmesi sahibi, ortağı veya çalışanları</li>
              <li className="flex items-start gap-2 text-sm text-gray-600"><XDot /> Marka/yetkili servis çalışanı, temsilcisi veya anlaşmalı hizmet sağlayıcıları</li>
            </ul>
          </div>
        </div>
        <p className="text-xs text-gray-400 leading-relaxed mt-3">
          Bu gruplardan biri olup yanlış beyanda bulunduğu sonradan anlaşılan hesaplar kapatılır, içerikleri kaldırılır.
        </p>
      </section>

      {/* ── Nasıl işler — numaralı zaman çizelgesi ── */}
      <section className="mb-10">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Nasıl işler?</h2>
        <div className="space-y-0">
          {STEPS.map((s, i) => (
            <div key={s.title} className="flex gap-3">
              <div className="flex flex-col items-center shrink-0">
                <span
                  className="flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold"
                  style={{ background: "var(--link-soft)", color: "var(--link)" }}
                >
                  {i + 1}
                </span>
                {i < STEPS.length - 1 && <span className="w-px flex-1 bg-gray-200 my-1" />}
              </div>
              <div className="pb-5 min-w-0">
                <p className="text-sm font-semibold text-gray-900">{s.title}</p>
                <p className="text-xs text-gray-500 leading-relaxed mt-0.5">{s.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Sık Sorulanlar — native details/summary akordiyonu ── */}
      <section className="mb-10">
        <h2 className="text-lg font-bold text-gray-900 mb-2">Sık Sorulanlar</h2>
        <div>
          {FAQS.map((f) => (
            <details key={f.q} className="group border-b border-gray-100 py-3.5">
              <summary className="flex cursor-pointer items-center justify-between gap-3 text-sm font-semibold text-gray-900 list-none [&::-webkit-details-marker]:hidden focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2" style={{ outlineColor: "var(--link)" }}>
                {f.q}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="shrink-0 transition-transform duration-200 group-open:rotate-180" aria-hidden="true">
                  <path d="M6 9l6 6 6-6" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </summary>
              <p className="text-sm text-gray-600 leading-relaxed mt-2">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      <div className="text-center mb-8">
        <Link
          href="/usta-basvuru"
          className="inline-block px-6 py-3 rounded-xl text-sm font-semibold text-white"
          style={{ background: "#111" }}
        >
          Hemen Başvurun →
        </Link>
        <p className="text-xs text-gray-400 mt-2">Belge istemiyoruz, sadece anlattıklarınız yeterli.</p>
      </div>

      <p className="text-xs text-gray-400 leading-relaxed text-center">
        Notlarınız yayınlanmadan önce incelenir. Paylaştığınız bilgiler Gizlilik Politikamıza göre işlenir.
      </p>
    </div>
  );
}
