import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Kullanım Koşulları",
  description: "fikape.com kullanım koşulları ve hizmet şartları.",
};

export default function KullanimKosullariPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="mb-8">
        <Link href="/" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
          ← Ana sayfaya dön
        </Link>
      </div>

      <h1 className="text-3xl font-bold text-gray-900 mb-2">Kullanım Koşulları</h1>
      <p className="text-sm text-gray-400 mb-10">Son güncelleme: Temmuz 2026</p>

      <div className="prose prose-gray max-w-none space-y-8 text-gray-700 leading-relaxed">

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">1. Genel</h2>
          <p>
            Bu Kullanım Koşulları, <strong>fikape.com</strong> (&quot;Platform&quot;) üzerindeki tüm
            hizmetleri kapsayan bir sözleşmedir. Platforma kayıt olarak veya hizmetleri
            kullanarak bu koşulları okuduğunuzu ve kabul ettiğinizi beyan etmiş olursunuz.
          </p>
          <p className="mt-2">
            Koşulları kabul etmiyorsanız lütfen platformu kullanmayınız.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">2. Hizmetin Tanımı</h2>
          <p>
            fikape.com, araç kullanıcılarının Fiyat (FI), Kalite (KA) ve Performans (PE) başlıkları
            altında yapılandırılmış yorum ve puan paylaşabildiği bağımsız bir tüketici platformudur.
            Platform herhangi bir marka, bayi veya üretici ile ticari ilişki içinde değildir.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">3. Hesap Oluşturma ve Güvenlik</h2>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>Kayıt sırasında gerçek ve güncel bilgi sağlamakla yükümlüsünüz.</li>
            <li>Her kullanıcı yalnızca bir hesap oluşturabilir; çoklu hesap yasaktır.</li>
            <li>Hesap şifrenizi gizli tutmak ve yetkisiz erişimleri bildirmek sizin sorumluluğunuzdadır.</li>
            <li>18 yaşın altındaysanız platformu kullanmamalısınız.</li>
            <li>Hesap bilgilerini başkasıyla paylaşmak ya da devretmek yasaktır.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">4. Yorum ve İçerik Kuralları</h2>
          <p className="mb-2">
            Platforma içerik ekleyerek bu içeriğin gerçek kişisel deneyimlerinize dayandığını
            taahhüt edersiniz. Aşağıdaki içerikler kesinlikle yasaktır:
          </p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>Sahte veya uydurma araç sahipliğine dayanan yorumlar</li>
            <li>Rakip firmalar ya da bayiler adına yapılan organize yorum kampanyaları</li>
            <li>Hakaret, ayrımcılık, nefret söylemi veya kişisel saldırı içeren ifadeler</li>
            <li>Kişisel verilerin (telefon, adres vb.) paylaşımı</li>
            <li>Yanıltıcı, asılsız veya abartılı iddialar</li>
            <li>Telif hakkı ihlali içeren metin, fotoğraf veya görseller</li>
            <li>Reklam, spam veya ticari promosyon amaçlı içerikler</li>
          </ul>
          <p className="mt-3 text-sm bg-gray-50 border border-gray-100 rounded-xl px-4 py-3">
            Moderasyon ekibimiz bu kurallara aykırı içerikleri önceden haber vermeksizin kaldırma
            ve ilgili hesabı askıya alma hakkını saklı tutar.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">5. &quot;Doğrulanmış Kullanıcı&quot; Rozeti</h2>
          <p>
            E-posta adresinizi doğruladığınızda &quot;Doğrulanmış Kullanıcı&quot; rozeti alırsınız. Bu rozet;
            platforma kaydının doğrulandığını gösterir, ancak araç sahipliğinin fiziksel
            belgelenmesini garanti etmez. Sahte araç sahipliği iddiasıyla yorum yapmak
            hesabın kalıcı olarak kapatılmasına yol açar.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">6. Fikri Mülkiyet</h2>
          <p className="mb-2">
            Platform üzerindeki logo, tasarım, yazılım kodu ve özgün içerikler fikape.com&apos;a aittir
            ve ilgili mevzuat kapsamında korunmaktadır.
          </p>
          <p>
            Paylaştığınız yorumların ve içeriklerin fikri mülkiyeti size aittir. Bununla birlikte,
            bu içerikleri Platform üzerinde yayımlamak, aramaya dahil etmek, özetlemek ve
            istatistiksel amaçla kullanmak için bize dünya genelinde, ücretsiz, alt lisanslanabilir
            bir lisans vermiş olursunuz. Bu lisans, hesabınızı silmenizle sona erer.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">7. Platformun Sorumluluğu</h2>
          <p className="mb-2">
            fikape.com aşağıdaki durumlarda sorumluluk kabul etmez:
          </p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>Kullanıcılar tarafından paylaşılan yorumların doğruluğu veya güncelliği</li>
            <li>Yorumlara dayanılarak verilen satın alma kararlarının sonuçları</li>
            <li>Üçüncü taraf bağlantılarının içeriği</li>
            <li>Teknik arıza, bakım veya mücbir sebeplerden kaynaklanan hizmet kesintileri</li>
          </ul>
          <p className="mt-3">
            Platform, yorum içeriklerini düzenli olarak moderasyon süreçlerinden geçirir; ancak
            tüm içeriklerin gerçek zamanlı denetlenmesini garanti edemez.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">8. Hesap Askıya Alma ve Kapatma</h2>
          <p className="mb-2">
            Aşağıdaki durumlarda hesabınız uyarısız askıya alınabilir veya kalıcı olarak kapatılabilir:
          </p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>Bu Kullanım Koşulları&apos;nın ihlali</li>
            <li>Sahte yorum veya çoklu hesap tespiti</li>
            <li>Platforma veya diğer kullanıcılara zarar verme girişimi</li>
            <li>Uzun süreli pasif hesap (24 ay boyunca hiç giriş yapılmaması)</li>
          </ul>
          <p className="mt-2">
            Hesabınızı kendiniz kapatmak için profil sayfanızdaki ilgili seçeneği kullanabilirsiniz.
            Hesap kapatma talebiniz işlendikten sonra kişisel verileriniz KVKK kapsamında
            gereken süreler dışında silinir.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">9. Hizmetin Değiştirilmesi</h2>
          <p>
            Platform özelliklerini, fiyatlandırmasını veya kapsam dahil ettiği araç kategorilerini
            önceden haber vermeksizin değiştirme hakkını saklı tutar. Temel hizmet koşullarında
            yapılan önemli değişiklikler kayıtlı e-posta adresinize bildirilir.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">10. Takas İlanları ve Kullanıcılar Arası İletişim</h2>
          <p>
            Platform, kullanıcıların araçlarını &quot;Takasa Açık&quot; olarak işaretleyip birbirleriyle
            platform içi mesajlaşma yoluyla iletişime geçmesine imkan tanır. Bu alan yalnızca bir
            iletişim aracıdır; fikape.com taraflar arasında kurulan hiçbir anlaşmanın, sözlü veya
            yazılı görüşmenin tarafı değildir ve bunların doğruluğu, güvenilirliği veya
            sonuçlarından sorumlu tutulamaz.
          </p>
          <p className="mt-2">
            İlan verirken paylaştığınız araç ve konum (il) bilgisinin doğruluğundan ve bu bilgileri
            paylaşma kararınızdan tamamen siz sorumlusunuz. Araç sahibi olmadığınız halde ilan
            vermek Kullanım Koşulları&apos;nın ihlalidir. Şüpheli veya kötü niyetli kullanıcı davranışını
            bildirmek için mesajlaşma ekranındaki &quot;Rapor Et&quot; özelliğini kullanabilirsiniz; platform
            gerekli gördüğü durumlarda hesapları kısıtlama hakkını saklı tutar.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">11. Uygulanacak Hukuk ve Uyuşmazlık Çözümü</h2>
          <p>
            Bu koşullar Türkiye Cumhuriyeti hukukuna tabidir. Taraflar arasında doğabilecek
            uyuşmazlıklarda İstanbul Merkez Mahkemeleri ve İcra Daireleri yetkilidir.
            Uyuşmazlıkları öncelikle{" "}
            <a href="mailto:info@fikape.com" className="underline text-gray-900">info@fikape.com</a>{" "}
            adresi üzerinden dostane yollarla çözmeye çalışırız.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">12. İletişim</h2>
          <p>
            Sorularınız veya şikayetleriniz için:{" "}
            <a href="mailto:info@fikape.com" className="underline text-gray-900">info@fikape.com</a>
          </p>
        </section>

      </div>
    </div>
  );
}
