import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Gizlilik Politikası",
  description: "fikape.com gizlilik politikası ve kişisel verilerin korunması hakkında bilgi.",
};

export default function GizlilikPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="mb-8">
        <Link href="/" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
          ← Ana sayfaya dön
        </Link>
      </div>

      <h1 className="text-3xl font-bold text-gray-900 mb-2">Gizlilik Politikası</h1>
      <p className="text-sm text-gray-400 mb-10">Son güncelleme: Haziran 2025</p>

      <div className="prose prose-gray max-w-none space-y-8 text-gray-700 leading-relaxed">

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">1. Veri Sorumlusu</h2>
          <p>
            Bu Gizlilik Politikası, <strong>fikape.com</strong> ("Platform", "biz") tarafından sunulan
            hizmetler kapsamında toplanan kişisel verilerin nasıl işlendiğini açıklamaktadır.
            Platform, 6698 sayılı Kişisel Verilerin Korunması Kanunu (KVKK) kapsamında veri sorumlusu
            sıfatıyla hareket etmektedir.
          </p>
          <p className="mt-2">
            İletişim: <a href="mailto:info@fikape.com" className="underline text-gray-900">info@fikape.com</a>
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">2. Hangi Veriler Toplanır?</h2>
          <p className="mb-2">Platforma kayıt olduğunuzda ve hizmetlerimizi kullandığınızda aşağıdaki veriler toplanabilir:</p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li><strong>Hesap bilgileri:</strong> E-posta adresi, görünen ad, şifrenizin şifrelenmiş hali</li>
            <li><strong>Araç sahipliği:</strong> Garajınıza eklediğiniz araçlara ilişkin bilgiler</li>
            <li><strong>Yorum ve puanlar:</strong> Paylaştığınız araç yorumları, FI·KA·PE puanları ve detay metinler</li>
            <li><strong>Kullanım verileri:</strong> Sayfa görüntüleme sayıları, oturum bilgileri</li>
            <li><strong>Onay kayıtları:</strong> KVKK kapsamında verdiğiniz açık rızalar</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">3. Veriler Nasıl Kullanılır?</h2>
          <p className="mb-2">Toplanan veriler aşağıdaki amaçlarla işlenmektedir:</p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>Hesabınızın oluşturulması ve güvenliğinin sağlanması</li>
            <li>E-posta doğrulama ve "doğrulanmış kullanıcı" rozetinin verilmesi</li>
            <li>Yorumlarınızın platform üzerinde yayımlanması</li>
            <li>Spam ve sahte yorum tespiti ile içerik moderasyonu</li>
            <li>Platform kalitesinin iyileştirilmesi ve hataların giderilmesi</li>
            <li>Yasal yükümlülüklerin yerine getirilmesi</li>
          </ul>
          <p className="mt-3 text-sm bg-gray-50 border border-gray-100 rounded-xl px-4 py-3">
            Verileriniz hiçbir koşulda üçüncü taraflara satılmaz veya reklam amaçlı kullanılmaz.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">4. Hukuki Dayanak</h2>
          <p className="mb-2">Kişisel verileriniz KVKK'nın 5. maddesi uyarınca aşağıdaki hukuki dayanaklar çerçevesinde işlenmektedir:</p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li><strong>Sözleşmenin ifası:</strong> Hesap oluşturma ve hizmet sunumu</li>
            <li><strong>Açık rıza:</strong> E-posta doğrulama ve iletişim için</li>
            <li><strong>Meşru menfaat:</strong> Platform güvenliği ve sahte içerik önleme</li>
            <li><strong>Hukuki yükümlülük:</strong> Yasal saklama gereklilikleri</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">5. Veri Saklama Süreleri</h2>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>Aktif hesap verileri: Hesabınız açık olduğu sürece</li>
            <li>Yorumlar ve puanlar: Hesap silme talebinize kadar</li>
            <li>Oturum verileri: Oturumun kapanmasından itibaren en fazla 30 gün</li>
            <li>Yasal zorunluluk bulunan kayıtlar: İlgili mevzuatta öngörülen süreler boyunca</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">6. Üçüncü Taraf Hizmetleri</h2>
          <p className="mb-2">Platform, aşağıdaki üçüncü taraf hizmetlerinden yararlanmaktadır:</p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li><strong>Supabase (PostgreSQL):</strong> Veri tabanı altyapısı — AB GDPR uyumlu</li>
            <li><strong>Vercel:</strong> Uygulama barındırma ve dağıtım — GDPR uyumlu</li>
            <li><strong>Resend:</strong> Doğrulama e-postaları — GDPR uyumlu</li>
          </ul>
          <p className="mt-2 text-sm text-gray-500">
            Bu hizmet sağlayıcılar yalnızca Platform'un işlevselliği için gerekli minimum veriyi işler
            ve kendi gizlilik politikaları kapsamında hareket eder.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">7. Çerezler (Cookie)</h2>
          <p className="mb-2">Platform yalnızca işlevsel çerezler kullanmaktadır:</p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li><strong>Oturum çerezi:</strong> Giriş durumunuzu koruyan güvenli, şifreli JWT tokeni</li>
          </ul>
          <p className="mt-2">
            Reklam, izleme veya analitik amacıyla üçüncü taraf çerezi kullanılmamaktadır.
            Tarayıcı ayarlarınızdan çerezleri devre dışı bırakabilirsiniz; ancak bu durumda
            oturum açma işlevselliği çalışmayacaktır.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">8. KVKK Kapsamındaki Haklarınız</h2>
          <p className="mb-2">KVKK'nın 11. maddesi uyarınca aşağıdaki haklara sahipsiniz:</p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>Kişisel verilerinizin işlenip işlenmediğini öğrenme</li>
            <li>İşlenen verileriniz hakkında bilgi talep etme</li>
            <li>İşlenme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenme</li>
            <li>Eksik veya yanlış işlenmiş verilerin düzeltilmesini talep etme</li>
            <li>Verilerin silinmesini veya yok edilmesini talep etme</li>
            <li>İşlemeye itiraz etme ve zararın giderilmesini talep etme</li>
          </ul>
          <p className="mt-3">
            Bu haklarınızı kullanmak için{" "}
            <a href="mailto:info@fikape.com" className="underline text-gray-900">info@fikape.com</a>{" "}
            adresine yazabilir veya profiliniz üzerinden hesabınızı silebilirsiniz.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">9. Güvenlik</h2>
          <p>
            Şifreleriniz bcrypt ile tek yönlü hashlenerek saklanmakta; oturumlar HTTPS üzerinden
            şifreli JWT ile yönetilmektedir. E-posta doğrulama linkleri HMAC-SHA256 imzalıdır
            ve 24 saat geçerlidir. Güvenlik ihlali şüphesi durumunda derhal bilgilendirileceksiniz.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">10. Politika Güncellemeleri</h2>
          <p>
            Bu politikayı zaman zaman güncelleyebiliriz. Önemli değişiklikler kayıtlı e-posta
            adresinize bildirilir. Güncel versiyona her zaman bu sayfadan ulaşabilirsiniz.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">11. İletişim</h2>
          <p>
            Gizlilik ile ilgili sorularınız için:{" "}
            <a href="mailto:info@fikape.com" className="underline text-gray-900">info@fikape.com</a>
          </p>
        </section>

      </div>
    </div>
  );
}
