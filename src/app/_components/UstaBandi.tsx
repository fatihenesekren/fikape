import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// Ana sayfa "Usta musunuz?" bandı — quiz kapalıyken Son Yorumlar ile NiyetKarti
// arasında, quiz açıkken (Son Yorumlar/Trend gizlendiğinde) kategori
// sekmelerinin hemen altında görünür; page.tsx'te `!quizParam` koşuluyla
// sarılır (kullanıcı açıkça istedi: quiz modunda hiç görünmesin).
// 5 uzman ajan (Görsel Tasarım, Metin, Marka Tutarlılığı, Erişilebilirlik,
// Mobil) paneliyle tasarlandı — 13 Eylül 2026. Bilinçli olarak nötr (beyaz
// kart + --link aksan) — amber/EXPERT_BADGE paleti yalnız rozette kalsın,
// sayfa-seviyesi bileşene sızmasın (marka tutarlılığı ajanının uyarısı:
// "reklam şeridi" hissi riski).
//
// ⟳ Aktif usta artık null DÖNMÜYOR — aynı bant, kendi paneline (Usta
// Görüşüm) götüren farklı bir içerikle gösteriliyor (kullanıcı isteği: boş
// yer yerine kendi işine hızlı erişim). Üstte "Son Yorumlar" ile aynı
// ritimde bir bölüm başlığı da eklendi (3 uzman ajanla — IA/isimlendirme/
// teknik — kararlaştırılan "Usta Görüşüm" markalaması burada da tutarlı).
export async function UstaBandi() {
  const session = await auth();
  let isActiveExpert = false;
  if (session?.user?.id) {
    const profile = await prisma.expertProfile.findUnique({
      where: { userId: Number(session.user.id) },
      select: { status: true },
    });
    isActiveExpert = profile?.status === "ACTIVE";
  }

  return (
    // pt-3 + <h2> — RecentReviews'daki ("💬 Son Yorumlar") AYNI ritim, önceki
    // pt-8'in boş bıraktığı alan artık bir başlıkla doluyor (toplam boşluk
    // artmıyor, kullanıcı bunu açıkça istedi).
    <section className="w-full max-w-7xl mx-auto px-4 pt-3">
      <h2 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
        <span aria-hidden="true">🔧</span> Usta Görüşü
      </h2>
      <Link
        href={isActiveExpert ? "/profil#usta-gorusu" : "/usta-ol"}
        aria-label={isActiveExpert ? "Usta panelinize gidin" : undefined}
        className="flex items-center justify-between gap-3 rounded-2xl px-4 py-3.5 min-h-11 border border-gray-100 bg-white transition-shadow hover:shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
        style={{ outlineColor: "var(--link)" }}
      >
        <div className="flex items-center gap-3 min-w-0">
          <span
            className="flex items-center justify-center w-9 h-9 rounded-full shrink-0 text-base"
            style={{ background: "var(--link-soft)" }}
            aria-hidden="true"
          >
            🧑‍🔧
          </span>
          <span className="min-w-0">
            {isActiveExpert ? (
              <>
                <span className="block text-sm font-semibold text-gray-900">Usta Görüşünüze göz atın</span>
                <span className="hidden sm:block text-xs text-gray-500 truncate">
                  Yeni not yazın, danışan mesajlarınızı görün
                </span>
              </>
            ) : (
              <>
                <span className="block text-sm font-semibold text-gray-900">Usta Görüşleri&apos;ne katkı sağlayın</span>
                <span className="hidden sm:block text-xs text-gray-500 truncate">
                  Tamirci/servis sahibiyseniz deneyiminizi paylaşın, kullanıcılar sizi bulsun
                </span>
              </>
            )}
          </span>
        </div>
        <span
          className="flex items-center gap-1 text-xs font-semibold rounded-xl px-4 py-2 shrink-0 text-white"
          style={{ background: "var(--btn-dark)" }}
        >
          {isActiveExpert ? "Panelim" : "Katıl"}
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M5 12h14M13 6l6 6-6 6" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </Link>
    </section>
  );
}
