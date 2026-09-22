import type { Metadata } from "next";
import Link from "next/link";
import { BASE_URL } from "@/lib/baseUrl";

export const metadata: Metadata = {
  title: "Üyelik Sözleşmesi",
  description:
    "fikape.com ile üye arasındaki üyelik ilişkisini düzenleyen bağlayıcı sözleşme: üyelik şartları, yükümlülükler, platformun sorumluluk sınırları ve hesap sonlandırma koşulları.",
};

const webPageJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "Üyelik Sözleşmesi",
  url: `${BASE_URL}/uyelik-sozlesmesi`,
  dateModified: "2026-09-22",
  isPartOf: { "@type": "WebSite", name: "fikape", url: BASE_URL },
};

export default function UyelikSozlesmesiPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageJsonLd) }}
      />

      <div className="mb-8">
        <Link href="/" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
          ← Ana sayfaya dön
        </Link>
      </div>

      <h1 className="text-3xl font-bold text-gray-900 mb-2">Üyelik Sözleşmesi</h1>
      <p className="text-sm text-gray-400 mb-10">Son güncelleme: Eylül 2026</p>

      <div className="prose prose-gray max-w-none space-y-8 text-gray-700 leading-relaxed">

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">1. Taraflar</h2>
          <p>
            İşbu Üyelik Sözleşmesi (&quot;Sözleşme&quot;), bir tarafta <strong>fikape.com</strong>
            (&quot;Platform&quot;, &quot;fikape&quot;, &quot;biz&quot;) ile diğer tarafta Platform&apos;a üye olan gerçek kişi
            (&quot;Üye&quot;, &quot;Kullanıcı&quot;, &quot;siz&quot;) arasında, Üye&apos;nin kayıt formunu doldurup hesap
            oluşturduğu anda elektronik ortamda kurulmuş sayılır. Kayıt olarak veya Platform&apos;u
            kullanarak bu Sözleşme&apos;yi okuduğunuzu, anladığınızı ve tüm hükümlerini kabul ettiğinizi
            beyan etmiş olursunuz. Sözleşme&apos;yi kabul etmiyorsanız lütfen kayıt olmayınız ve
            Platform&apos;u kullanmayınız.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">2. Tanımlar</h2>
          <ul className="list-disc pl-5 space-y-1.5">
            <li><strong>Platform:</strong> fikape.com internet sitesi ve buna bağlı tüm dijital hizmetler.</li>
            <li><strong>Üye/Kullanıcı:</strong> Platform&apos;a kayıt olan ve hesabı üzerinden hizmetlerden
            yararlanan gerçek kişi.</li>
            <li><strong>İçerik:</strong> Üye tarafından paylaşılan yorum, puan, soru, cevap, fotoğraf,
            ilan, mesaj, usta notu ve benzeri her türlü metin/görsel veri.</li>
            <li><strong>Takas Pazarı:</strong> Üyelerin araçlarını &quot;Takasa Açık&quot; olarak ilan edip
            birbirleriyle platform içi mesajlaşma yoluyla iletişim kurabildiği hizmet.</li>
            <li><strong>Usta Görüşleri:</strong> Deneyimli kişilerin araç modelleri hakkında teknik bilgi
            paylaştığı, kendi beyanına dayalı bölüm.</li>
            <li><strong>Fikape Plus:</strong> Giriş yapmış üyelerin, Platform&apos;un gelecekteki
            yönünü (mevcut özelliklerin geliştirilmesi, yapay zekâ destekli fikirler ve uzun
            vadeli öneriler dahil) hangi fikirlere ilgi göstererek şekillendirdiği, ücretli bir
            katman olmayan yol haritası bölümü.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">3. Üyeliğin Kapsamı ve Şartları</h2>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>Platform&apos;a üye olabilmek için 18 yaşını doldurmuş, fiil ehliyetine sahip bir gerçek
            kişi olmanız gerekir. 18 yaşından küçükseniz Platform&apos;a üye olamazsınız ve
            hizmetlerden yararlanamazsınız.</li>
            <li>Üyelik başvurusu, kayıt formunda istenen bilgilerin (e-posta, görünen ad, şifre) eksiksiz
            ve doğru şekilde girilmesiyle tamamlanır.</li>
            <li>Her gerçek kişi yalnızca bir üyelik hesabı oluşturabilir; aynı kişiye ait çoklu hesap
            oluşturulması bu Sözleşme&apos;nin ihlalidir.</li>
            <li>Üyelik, Platform&apos;un temel hizmetleri (yorum/puan paylaşımı, Takas Pazarı, Usta
            Görüşleri, garaj yönetimi vb.) bakımından şu an için ücretsizdir.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">4. Üye&apos;nin Yükümlülükleri</h2>
          <p className="mb-2">Üye olarak aşağıdaki yükümlülükleri kabul edersiniz:</p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li><strong>Doğru bilgi verme:</strong> Kayıt sırasında ve hesap kullanımı boyunca güncel,
            doğru ve eksiksiz bilgi sağlamakla yükümlüsünüz. Yanlış veya yanıltıcı bilgi vermeniz
            hesabınızın askıya alınmasına veya kapatılmasına yol açabilir.</li>
            <li><strong>Hesap güvenliği:</strong> Şifrenizi gizli tutmak, hesabınıza yetkisiz erişim
            olduğunu fark ettiğinizde derhal bize bildirmek ve hesap bilgilerinizi üçüncü kişilerle
            paylaşmamak sizin sorumluluğunuzdadır. Hesabınız üzerinden gerçekleştirilen tüm işlemlerden
            siz sorumlusunuz.</li>
            <li><strong>İçerik kuralları:</strong> Paylaştığınız her türlü içeriğin (yorum, ilan, mesaj,
            usta notu, soru/cevap vb.) gerçek deneyiminize dayandığını, hakaret, ayrımcılık, nefret
            söylemi, kişisel veri ifşası, telif ihlali, spam veya yanıltıcı iddia içermediğini taahhüt
            edersiniz. Platform, paylaşılan içerikleri otomatik içerik filtresi (iletişim bilgisi/reklam
            tespiti) ve insan moderasyonuyla denetler; kurallara aykırı içerikler önceden haber
            verilmeksizin kaldırılabilir. Detaylı içerik kuralları için bkz.{" "}
            <Link href="/kullanim-kosullari" className="underline">Kullanım Koşulları</Link>.</li>
            <li><strong>Mevzuata uygunluk:</strong> Platform&apos;u kullanırken yürürlükteki mevzuata,
            üçüncü kişilerin haklarına ve genel ahlak kurallarına uymayı kabul edersiniz.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">5. Platformun Rolü ve Sorumluluk Reddi</h2>
          <p className="mb-2">
            fikape.com, kullanıcıların araç deneyimlerini paylaştığı ve Takas Pazarı üzerinden
            birbirleriyle iletişim kurabildiği bir <strong>aracı platformdur</strong>. Bu kapsamda:
          </p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>Platform, Üyeler arasında gerçekleşen takas, satış veya herhangi bir mal/hizmet
            değişimine taraf değildir; bu işlemlerin tarafı, muhatabı veya garantörü değildir.</li>
            <li>İlan, mesaj veya yorum içeriğindeki bilgilerin (araç durumu, hasar/tramer beyanı, fiyat,
            konum vb.) doğruluğu tamamen ilgili Üye&apos;nin beyanına dayanır; Platform bu bilgileri
            doğrulamaz ve doğruluğunu garanti etmez.</li>
            <li>Üyeler arasında doğabilecek anlaşmazlıklardan, mağduriyetlerden veya zararlardan Platform
            sorumlu tutulamaz. Şüpheli davranış &quot;Rapor Et&quot; özelliğiyle bildirilebilir; Platform,
            gerekli gördüğü hallerde ilgili hesabı kısıtlayabilir ancak bu, uyuşmazlığın tarafı olduğu
            anlamına gelmez.</li>
            <li>Usta Görüşleri bölümündeki notlar, ustaların gönüllü ve kendi beyanına dayalı katkısıdır;
            Platform kimlik/meslek doğrulaması yapmaz ve bir ustayı iş için önermez veya işçiliğine
            kefil olmaz.</li>
            <li>Platform, hizmetin kesintisiz veya hatasız çalışacağını garanti etmez; teknik arıza,
            bakım veya mücbir sebeplerden doğan kesintilerden sorumlu değildir.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">6. Fikri Mülkiyet</h2>
          <p className="mb-2">
            Platform üzerindeki logo, marka, tasarım, yazılım kodu ve özgün editoryal içerikler
            fikape.com&apos;a aittir ve ilgili fikri mülkiyet mevzuatı kapsamında korunmaktadır.
            Bunların izinsiz kopyalanması, çoğaltılması veya ticari amaçla kullanılması yasaktır.
          </p>
          <p>
            Paylaştığınız içeriklerin (yorum, fotoğraf, usta notu vb.) fikri mülkiyeti size aittir.
            Bununla birlikte, bu içerikleri Platform üzerinde yayımlamak, aramaya dahil etmek,
            özetlemek ve istatistiksel/tanıtım amaçlı kullanmak için Platform&apos;a dünya genelinde
            geçerli, ücretsiz, alt lisanslanabilir bir kullanım hakkı vermiş olursunuz. Bu hak,
            hesabınızı sildiğinizde sona erer.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">7. Hesabın Askıya Alınması ve Sonlandırılması</h2>
          <p className="mb-2">
            Hesabınız, kayıt anında en düşük yetki seviyesinden (TrustLevel 1 — e-posta doğrulamalı)
            başlar ve doğrulanmış araç sahipliği gibi ölçütlere göre kademeli olarak yükselebilir. Bu
            seviye sistemi, moderasyon önceliklendirmesi ve sahte içerik tespiti amacıyla kullanılır.
          </p>
          <p className="mb-2">Aşağıdaki durumlarda hesabınız önceden haber verilmeksizin askıya alınabilir
          veya kalıcı olarak kapatılabilir:</p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>İşbu Sözleşme&apos;nin veya <Link href="/kullanim-kosullari" className="underline">Kullanım
            Koşulları</Link>&apos;nın ihlali</li>
            <li>Sahte içerik, sahte araç sahipliği iddiası veya çoklu hesap tespiti</li>
            <li>Platforma, diğer kullanıcılara veya üçüncü kişilere zarar verme girişimi</li>
            <li>Uzun süreli pasif hesap (24 ay boyunca hiç giriş yapılmaması)</li>
          </ul>
          <p className="mt-2">
            Hesabınızı dilediğiniz zaman kendiniz de kapatabilirsiniz (Profil &rsaquo; Hesabımı Sil).
            Hesap kapatma talebiniz işlendikten sonra kişisel verileriniz, KVKK ve ilgili mevzuat
            kapsamında öngörülen saklama süreleri dışında silinir; detaylar için{" "}
            <Link href="/gizlilik" className="underline">Gizlilik Politikası</Link>&apos;na bakınız.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">8. Ücretli Hizmetler</h2>
          <p>
            İşbu Sözleşme&apos;nin yürürlüğe girdiği tarih itibarıyla Platform&apos;un tüm hizmetleri
            (yorum/puan paylaşımı, garaj yönetimi, Takas Pazarı, Usta Görüşleri dahil) <strong>ücretsizdir</strong>.
            Fikape Plus, üyelerin Platform&apos;un gelecekteki yönüne dair fikirlere oy verdiği ücretsiz bir
            yol haritası bölümüdür; şu an ücretli bir hizmet sunulmamaktadır. Platform,
            ileride ücretli bir hizmet modeli sunmayı planlaması halinde, bu değişikliği yürürlüğe
            girmeden makul bir süre önce kayıtlı e-posta adresinize ve/veya Platform üzerinden açıkça
            duyuracak; ücretli bir hizmete geçiş, Üye&apos;nin açık onayı olmaksızın mevcut ücretsiz
            hizmetleri kısıtlamayacaktır.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">9. Uyuşmazlıkların Çözümü</h2>
          <p>
            İşbu Sözleşme Türkiye Cumhuriyeti hukukuna tabidir. Sözleşme&apos;den doğan uyuşmazlıklarda,
            6502 sayılı Tüketicinin Korunması Hakkında Kanun kapsamındaki parasal sınırlar dahilinde
            İl/İlçe Tüketici Hakem Heyetleri, bu sınırları aşan uyuşmazlıklarda ise Tüketici Mahkemeleri
            (bulunmayan yerlerde yetkili Asliye Hukuk Mahkemeleri) ile İstanbul Merkez (Çağlayan)
            Mahkemeleri ve İcra Daireleri yetkilidir. Taraflar, uyuşmazlıkları öncelikle{" "}
            <a href="mailto:info@fikape.com" className="underline text-gray-900">info@fikape.com</a>{" "}
            adresi üzerinden dostane yollarla çözmeye gayret gösterir.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">10. Değişiklik Hakkı</h2>
          <p>
            Platform, işbu Sözleşme&apos;yi zaman zaman güncelleme hakkını saklı tutar. Sözleşme&apos;de
            yapılan önemli değişiklikler kayıtlı e-posta adresinize bildirilir ve/veya Platform üzerinde
            duyurulur. Güncel Sözleşme metnine her zaman bu sayfadan ulaşabilirsiniz. Değişiklik sonrası
            Platform&apos;u kullanmaya devam etmeniz, güncel Sözleşme&apos;yi kabul ettiğiniz anlamına gelir.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">11. Yürürlük</h2>
          <p>
            İşbu Sözleşme, Üye&apos;nin kayıt formunu onaylayıp hesabını oluşturduğu anda yürürlüğe girer
            ve Üye hesabını silene veya Platform tarafından sonlandırılana kadar yürürlükte kalır. Bu
            Sözleşme, <Link href="/gizlilik" className="underline">Gizlilik Politikası</Link> ve{" "}
            <Link href="/kullanim-kosullari" className="underline">Kullanım Koşulları</Link> ile birlikte
            bütün olarak değerlendirilir; aralarında çelişki olması halinde, ilgili konudaki daha
            spesifik hüküm esas alınır.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">12. İletişim</h2>
          <p>
            Sorularınız veya talepleriniz için:{" "}
            <a href="mailto:info@fikape.com" className="underline text-gray-900">info@fikape.com</a>
          </p>
        </section>

      </div>
    </div>
  );
}
