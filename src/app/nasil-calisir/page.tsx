import type { Metadata } from "next";
import Link from "next/link";
import { EXPERT_BADGE } from "@/lib/expertNote";

export const metadata: Metadata = {
  title: "Nasıl Çalışır",
  description:
    "fikape'de neler yapabileceğiniz, FI·KA·PE puanlama metodolojisi, güven seviyeleri (TrustLevel) ve moderasyon kuralları hakkında bilgi.",
};

const PLATFORM_MAP = [
  { title: "Araç ara, yorum yaz", body: "Binlerce araç arasından ara, kendi deneyimini FI·KA·PE puanıyla paylaş.", href: "/araclar" },
  { title: "Garajına ekle", body: "Sahip olduğun/olduğun araçları garajına ekle, sahiplik geçmişini tut.", href: "/garajim" },
  { title: "Takasa çıkar", body: "Aracını takasa aç, ilgilenen kullanıcılarla platform içi mesajlaş.", href: "/takas" },
  { title: "Usta görüşü oku", body: "Deneyimli ustaların model bazlı teknik notlarını incele, sen de ustaysan görüşünü paylaş.", href: "/usta-ol" },
  { title: "Karşılaştır", body: "Birden fazla aracı yan yana, puan bazında karşılaştır.", href: "/karsilastir" },
] as const;

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
        fikape&apos;de neler yapabileceğiniz ve puanlama metodolojimiz, güven sistemimiz, moderasyon kurallarımız.
      </p>

      {/* Platform haritası — sayfa "Nasıl Çalışır" adını taşırken içerik
          sadece puanlama sistemini anlatıyordu, site genelini hiç
          kapsamıyordu (kullanıcı onayıyla, 3 uzman denetimi 2026-09-22).
          Her özelliğin DETAYI kendi sayfasında kalıyor — burada sadece
          yönlendirme, tekrar/bakım yükü yaratmasın diye. */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-12">
        {PLATFORM_MAP.map((item) => (
          <Link
            key={item.title}
            href={item.href}
            className="bg-white border border-gray-100 rounded-2xl p-4 hover:border-gray-300 transition-colors"
          >
            <p className="text-sm font-semibold text-gray-900">{item.title}</p>
            <p className="text-xs text-gray-500 leading-relaxed mt-0.5">{item.body}</p>
          </Link>
        ))}
      </div>

      <div className="prose prose-gray max-w-none space-y-8 text-gray-700 leading-relaxed">

        {/* Sıra değişti: okuyucu önce "kim/ne" sorusuna cevap bulsun,
            sonra "nasıl hesaplanıyor"a geçsin (UX denetimi, 2026-09-22). */}
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
          <h2 className="text-lg font-semibold text-gray-900 mb-3">FI·KA·PE puanı nasıl hesaplanır?</h2>
          <p>
            Her yorum üç kategoride 1-10 arası puanlanır: <strong>Fİ (Fiyat)</strong>, <strong>KA (Kalite/Dayanıklılık)</strong>
            {" "}ve <strong>PE (Performans/Kullanım deneyimi)</strong>. Genel puan bu üçünün ağırlıklı ortalamasıdır:
          </p>
          <p className="mt-2 font-mono text-sm bg-gray-50 rounded-lg px-4 py-3">
            Genel Puan = Fiyat × 0.30 + Kalite × 0.35 + Performans × 0.35
          </p>
          <p className="mt-2 text-sm text-gray-500">
            Örnek: Fiyat 8, Kalite 7, Performans 9 verilirse → 8×0.30 + 7×0.35 + 9×0.35 = <strong>8.0</strong> puan.
          </p>
          <p className="mt-2">
            Bir aracın sayfasındaki genel puan, o araca ait yayınlanmış tüm yorumların ortalamasıdır.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Güven seviyeleri (TrustLevel)</h2>
          <p className="mb-2">Her kullanıcının profilinde şu seviyelerden biri gösterilir:</p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li><strong>Üye</strong> — kayıt olmuş, henüz e-posta doğrulamamış.</li>
            <li><strong><span aria-hidden="true">✉️</span> Doğrulanmış</strong> — e-posta adresi doğrulanmış.</li>
            <li><strong><span aria-hidden="true">📸</span> Fotoğraf Doğrulamalı</strong> — yorumuna eklediği fotoğraf admin tarafından onaylanmış.</li>
            <li><strong><span aria-hidden="true">⚙️</span> Admin</strong> — fikape ekibi.</li>
          </ul>
          <p className="mt-2">
            Ayrıca her yorumun arkasında, kullanıcının güven seviyesi ve Garaj&apos;daki gerçek sahiplik kaydıyla
            tutarlılığına dayanan dahili bir güven sinyali hesaplanır. Bu sinyal okuyucuya gösterilmez;
            amacı moderasyon ekibine ve gelecekteki sıralama iyileştirmelerine yardımcı olmaktır.
          </p>
        </section>

        {/* TrustLevel'dan görsel olarak ayrı bir bölüme çıkarıldı — aynı
            başlık altında art arda gelmesi "Usta da bir TrustLevel mi"
            karışıklığı yaratıyordu (UX denetimi, 2026-09-22). */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Usta rozeti nedir?</h2>
          <div className="rounded-xl p-4" style={{ background: EXPERT_BADGE.bg }}>
            <p style={{ color: EXPERT_BADGE.color }}>
              <strong><span aria-hidden="true">{EXPERT_BADGE.icon}</span> Usta</strong> rozeti, güven
              seviyelerinden (TrustLevel) tamamen ayrı bir eksendir — bir kullanıcının hesap güvenini değil,
              Usta Görüşleri bölümüne başvurup kabul edilmiş bir katkıcı olduğunu gösterir. Usta notları
              FI·KA·PE puanını etkilemez ve sıralamada yer değiştirmez.
            </p>
          </div>
          <p className="mt-2 text-sm text-gray-500">
            Usta iseniz katkı sağlamak veya usta görüşlerine göz atmak için{" "}
            <Link href="/usta-ol" className="text-link hover:underline">Usta Görüşleri hakkında bilgi alın →</Link>
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Moderasyon</h2>
          <p>
            Yeni yorumlar doğrudan yayınlanmaz — önce fikape ekibi tarafından incelenir. Bazı sinyaller
            (aynı fotoğrafın tekrar kullanılması, içerik filtresine takılan ifadeler) yorumu gönderim
            anında otomatik olarak reddeder. Diğerleri (aynı IP&apos;den gelen tekrar yorumlar, aynı
            artı/eksi seti tekrarı, bir ürüne kısa sürede gelen anormal yorum yoğunluğu gibi) otomatik
            olarak engellemez — sadece moderatöre uyarı olarak gösterilir, yayın kararını her zaman bir
            insan verir.
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
