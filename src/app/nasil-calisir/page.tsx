import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Nasıl Çalışır",
  description:
    "fikape'deki FI·KA·PE puanlama metodolojisi, güven seviyeleri (TrustLevel) ve moderasyon kuralları hakkında bilgi.",
};

export default function NasilCalisirPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="mb-8">
        <Link href="/" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
          ← Ana sayfaya dön
        </Link>
      </div>

      <h1 className="text-3xl font-bold text-gray-900 mb-2">Nasıl Çalışır</h1>
      <p className="text-sm text-gray-400 mb-10">
        fikape&apos;nin puanlama metodolojisi, güven sistemi ve moderasyon kuralları.
      </p>

      <div className="prose prose-gray max-w-none space-y-8 text-gray-700 leading-relaxed">

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">FI·KA·PE puanı nasıl hesaplanır?</h2>
          <p>
            Her yorum üç kategoride 1-10 arası puanlanır: <strong>Fİ (Fiyat)</strong>, <strong>KA (Kalite/Dayanıklılık)</strong>
            {" "}ve <strong>PE (Performans/Kullanım deneyimi)</strong>. Genel puan bu üçünün ağırlıklı ortalamasıdır:
          </p>
          <p className="mt-2 font-mono text-sm bg-gray-50 rounded-lg px-4 py-3">
            Genel Puan = Fiyat × 0.30 + Kalite × 0.35 + Performans × 0.35
          </p>
          <p className="mt-2">
            Bir aracın sayfasındaki genel puan, o araca ait yayınlanmış tüm yorumların ortalamasıdır.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Kim yorum yazabilir?</h2>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>Yorum yazmak için e-posta adresinizi doğrulamanız gerekir.</li>
            <li>Bir araç için sadece bir yorum yazabilirsiniz (tekrar/spam önleme).</li>
            <li>Günlük yorum sınırı vardır (24 saatte en fazla 5 yorum).</li>
            <li>Satıcı, pazarlamacı veya marka hesapları normal kullanıcı yorumu yazamaz.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Güven seviyeleri (TrustLevel)</h2>
          <p className="mb-2">Her kullanıcının profilinde şu seviyelerden biri gösterilir:</p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li><strong>Üye</strong> — kayıt olmuş, henüz e-posta doğrulamamış.</li>
            <li><strong>✉️ Doğrulanmış</strong> — e-posta adresi doğrulanmış.</li>
            <li><strong>📸 Fotoğraf Doğrulamalı</strong> — yorumuna eklediği fotoğraf admin tarafından onaylanmış.</li>
            <li><strong>⚙️ Admin</strong> — fikape ekibi.</li>
          </ul>
          <p className="mt-2">
            Ayrıca her yorumun arkasında, kullanıcının güven seviyesi ve Garaj&apos;daki gerçek sahiplik kaydıyla
            tutarlılığına dayanan dahili bir güven sinyali hesaplanır. Bu sinyal okuyucuya gösterilmez;
            amacı moderasyon ekibine ve gelecekteki sıralama iyileştirmelerine yardımcı olmaktır.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Moderasyon</h2>
          <p>
            Yeni yorumlar doğrudan yayınlanmaz — önce fikape ekibi tarafından incelenir. İnceleme sırasında
            aynı IP&apos;den gelen tekrar yorumlar, aynı artı/eksi seti tekrarı, fotoğraf tekrar kullanımı ve
            bir ürüne kısa sürede gelen anormal yorum yoğunluğu gibi sinyaller kontrol edilir. Bu sinyaller
            otomatik olarak yorumu engellemez — sadece moderatöre uyarı olarak gösterilir, son kararı her
            zaman bir insan verir.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Kırmızı çizgilerimiz</h2>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>Puanlar ve sıralama asla parayla etkilenmez.</li>
            <li>Reklam veya sponsorlu içerik, organik yorum akışına karışmaz.</li>
            <li>Chip seçimi (artı/eksi) zorunludur, serbest metin isteğe bağlıdır — bu da yorumların
              gerçek kullanım deneyimine dayanmasını sağlar.</li>
          </ul>
        </section>

      </div>
    </div>
  );
}
