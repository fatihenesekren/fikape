import Link from "next/link";
import type { Metadata } from "next";

// Herkese açık, login gerektirmeyen tanıtım sayfası — /usta-basvuru'ya (login
// gerektiren, gerçek form) dokunmadan ayrı tutuldu (bkz. feature_usta_gorusleri_ilerleme.md,
// 13 Eylül 2026 teknik ajan kararı). Metin 5 uzman ajan paneliyle geliştirildi,
// kurucu onayladı — bkz. docs/usta-basvuru-tanitim-metni.md.
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

export default function UstaOlPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <Link href="/" className="text-xs font-semibold text-gray-500 hover:text-gray-800">
        ← Ana sayfaya dön
      </Link>

      <h1 className="text-2xl sm:text-3xl font-black text-gray-900 mt-4 mb-2">
        Usta Görüşleri&apos;ne Katılın
      </h1>
      <p className="text-base text-gray-700 leading-relaxed mb-1">
        <strong>Bir aracı yıllarca tamir etmiş veya bakımını yapmış biri misiniz?</strong> Bildikleriniz,
        o modeli almayı düşünen kullanıcılar için değerli. fikape&apos;de bunu paylaşarak hem topluluğa
        katkı sağlayın hem de kendi adınızla tanınır olun.
      </p>
      <p className="text-xs text-gray-400 italic leading-relaxed mb-8">
        Usta Görüşleri, ustaların gönüllü teknik katkısıdır — fikape bunu bir hizmet olarak satmaz,
        bilginizi paylaşmanıza aracılık eder.
      </p>

      <section className="mb-8">
        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wide mb-3">
          Bundan ne kazanırsınız?
        </h2>
        <ul className="space-y-2.5 text-sm text-gray-700 leading-relaxed">
          <li>
            <strong>Kendi tanıtım sayfanız</strong> — uzmanlık alanlarınız, yazdığınız notlar, isterseniz
            iletişim bilgileriniz tek sayfada.
          </li>
          <li>
            <strong>Görünürlük</strong> — örneğin bir model hakkında yazdığınız not, o modele bakan her
            kullanıcının karşısına çıkar; bulunduğunuz ildeki araç sahiplerine ulaşırsınız.
          </li>
          <li>
            <strong>İsteğe bağlı iletişim</strong> — telefon/iş yeri adresinizi paylaşmayı seçerseniz,
            ilk notunuz yayınlandıktan sonra size ulaşmak isteyenler bunu doğrudan görebilir. Paylaşmasanız
            da kullanıcılar site üzerinden mesaj gönderebilir.
          </li>
          <li>
            <strong>Şu an için ücretsizdir</strong> — fikape bu özellik için sizden ücret almaz.
          </li>
          <li>
            <strong>Yazmanız uzun sürmez</strong> — tek bir modelle ilgili bildiklerinizi birkaç cümleyle
            paylaşmanız yeterli.
          </li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wide mb-3">
          Kimler başvurabilir?
        </h2>
        <p className="text-sm text-gray-700 leading-relaxed mb-3">
          Araçları gerçekten tamir eden, bakımını yapan herkes — sertifika şartı yoktur, anlattıklarınız
          yeterli. <strong>Bir işletmeniz/dükkânınız olması gerekmez</strong> — kendi aracınıza veya
          çevrenizdekilerin araçlarına yıllarca bakmış, bu konuda gerçekten bilgili biriyseniz de
          başvurabilirsiniz.
        </p>
        <p className="text-sm font-semibold text-gray-800 mb-1.5">Başvuramayanlar:</p>
        <ul className="space-y-1.5 text-sm text-gray-700 leading-relaxed mb-3 list-disc pl-5">
          <li>Araç alım-satımı yapan galeri/oto pazarlama işletmesi sahibi, ortağı veya çalışanları</li>
          <li>Bir marka ya da yetkili servisin çalışanı, temsilcisi veya anlaşmalı hizmet sağlayıcıları</li>
        </ul>
        <p className="text-xs text-gray-400 leading-relaxed">
          18 yaşından büyük olmanız gerekir. Bu gruplardan biri olup yanlış beyanda bulunduğu sonradan
          anlaşılan hesaplar kapatılır, içerikleri kaldırılır.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wide mb-3">Nasıl işler?</h2>
        <ol className="space-y-2.5 text-sm text-gray-700 leading-relaxed list-decimal pl-5">
          <li>Kısa bir form doldurursunuz (~3 dakika): uzmanlık alanlarınız, iliniz, kendinizi anlatan bir metin.</li>
          <li>
            Başvurunuzu inceleriz (genellikle birkaç iş günü içinde) — kimlik veya belge istemeyiz,
            yalnızca anlattıklarınızın tutarlı olup olmadığına bakarız; genel geçer veya ticari bir
            işletmeyi çağrıştıran başvurular kabul edilmez.
          </li>
          <li>Başvurunuz kabul edilirse ilk notunuzu yazarsınız — bir model hakkında bildiklerinizi paylaşırsınız.</li>
          <li>
            Not yayınlandıktan sonra profiliniz, paylaşmayı seçtiyseniz iletişim bilgileriniz de bu
            noktadan itibaren görünür olur.
          </li>
        </ol>
        <p className="text-xs text-gray-400 leading-relaxed mt-3">
          Başvurunuz uygun bulunmazsa haber veririz; nedeniyle birlikte tekrar başvurabilirsiniz.
        </p>
      </section>

      <section className="mb-8 bg-gray-50 rounded-xl p-4">
        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wide mb-3">
          Bilmeniz gerekenler
        </h2>
        <ul className="space-y-2 text-xs text-gray-500 leading-relaxed">
          <li>fikape kimlik veya meslek belgesi doğrulaması yapmaz — başvurunuz kendi anlattıklarınıza dayanır.</li>
          <li>Notlarınız yayınlanmadan önce incelenir.</li>
          <li>
            fikape, sizinle kullanıcılar arasındaki hizmet ilişkisinin tarafı değildir, garanti vermez;
            paylaştığınız bilginin doğruluğundan siz sorumlusunuz — yanıltıcı içerik &quot;Usta&quot;
            statünüzün sonlandırılmasına yol açar.
          </li>
          <li>
            Başvurunuzda paylaştığınız bilgiler Gizlilik Politikamıza göre işlenir; iletişim bilgisi
            yalnızca siz görünür kılmayı seçerseniz yayınlanır.
          </li>
        </ul>
      </section>

      <div className="text-center mb-10">
        <Link
          href="/usta-basvuru"
          className="inline-block px-6 py-3 rounded-xl text-sm font-semibold text-white"
          style={{ background: "#111" }}
        >
          Başvurumu Gönder →
        </Link>
        <p className="text-xs text-gray-400 mt-2">Belge istemiyoruz, sadece anlattıklarınız yeterli.</p>
      </div>

      <section>
        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wide mb-3">Sık Sorulanlar</h2>
        <dl className="space-y-3 text-sm">
          <div>
            <dt className="font-semibold text-gray-800">Sertifika/belge gerekiyor mu?</dt>
            <dd className="text-gray-600 mt-0.5">Hayır, anlattıklarınız yeterli.</dd>
          </div>
          <div>
            <dt className="font-semibold text-gray-800">Ücretli mi?</dt>
            <dd className="text-gray-600 mt-0.5">Şu an için hayır, ücretsizdir.</dd>
          </div>
          <div>
            <dt className="font-semibold text-gray-800">İletişim bilgimi paylaşmak zorunda mıyım?</dt>
            <dd className="text-gray-600 mt-0.5">Hayır, isteğe bağlı — paylaşmasanız da mesaj alabilirsiniz.</dd>
          </div>
          <div>
            <dt className="font-semibold text-gray-800">Galerici/yetkili servis çalışanıysam olur mu?</dt>
            <dd className="text-gray-600 mt-0.5">Hayır, bu program bağımsız ustalar içindir.</dd>
          </div>
        </dl>
      </section>
    </div>
  );
}
