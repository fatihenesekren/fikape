import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isTradeListingEnabled } from "@/lib/features";

// Ana sayfa "Takas Pazarı" bandı — Usta Görüşü bandının (UstaBandi) hemen ALTINDA; page.tsx'te
// `!quizParam` koşuluyla sarılır (quiz modunda görünmez). Özellik kapalıyken hiç görünmez
// (tıklanınca çalışmayan bir akışa götürmesin). Kapatma/gizleme düğmesi YOK: önceki sürümdeki
// "Gizle" geri getirilemiyordu (bkz. kullanıcı geri bildirimi); UstaBandi de gizlenemiyor.
//
// Hedef ziyaretçiye göre değişir: garajında aracı olan üye → Takas Panelim; misafir ve aracı olmayan
// üye → tanıtım/şart sayfası (panel, takasla ilgisi olmayan üyeyi zaten tanıtım sayfasına yönlendirir;
// "Panelim" diye başlayıp tanıtım sayfasına düşmesin). Misafir için sorgu yok; üye için tek hafif
// varlık sorgusu (UstaBandi'ndeki aktif usta kontrolüyle aynı ağırlıkta).
export async function TakasBandi() {
  if (!isTradeListingEnabled()) return null;

  const session = await auth();
  let panelli = false;
  if (session?.user?.id) {
    const arac = await prisma.userProduct
      .findFirst({ where: { userId: Number(session.user.id), ownershipStatus: "CURRENT" }, select: { id: true } })
      .catch(() => null);
    panelli = arac != null;
  }

  return (
    <section className="w-full max-w-7xl mx-auto px-4 pt-3">
      <h2 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
        <span aria-hidden="true">🔄</span> Takas Pazarı
      </h2>
      <Link
        href={panelli ? "/takas-panelim" : "/takas-pazari-nasil-calisir"}
        aria-label={panelli ? "Takas panelinize gidin" : undefined}
        className="group flex items-center justify-between gap-3 rounded-2xl px-4 py-3.5 min-h-11 border border-gray-100 bg-white transition-shadow hover:shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
        style={{ outlineColor: "var(--link)" }}
      >
        <div className="flex items-center gap-3 min-w-0">
          <span
            className="flex items-center justify-center w-9 h-9 rounded-full shrink-0 text-base"
            style={{ background: "var(--link-soft)" }}
            aria-hidden="true"
          >
            🤝
          </span>
          <span className="min-w-0">
            {panelli ? (
              <>
                <span className="block text-sm font-semibold text-gray-900">Takas Panelinize göz atın</span>
                <span className="hidden sm:block text-xs text-gray-500 truncate">
                  İlanlarınızı, görüşmelerinizi ve kayıtlı aramalarınızı görün
                </span>
              </>
            ) : (
              <>
                <span className="block text-sm font-semibold text-gray-900">Aracınızı başka bir araçla takas edin</span>
                <span className="hidden sm:block text-xs text-gray-500 truncate">
                  Şartları ve adımları öğrenin, ilanları inceleyin
                </span>
              </>
            )}
          </span>
        </div>
        {/* İkincil eylem: yumuşak mavi ton (ana eylem NiyetKarti'ndeki siyah buton kalsın; üç bant aynı
            vurguda yarışmasın). Kart hover'ında koyulaşır, ok mobilde gizli (dar ekranda metne yer açar). */}
        <span className="flex items-center gap-1 whitespace-nowrap text-xs font-semibold rounded-xl px-3 sm:px-4 py-2 shrink-0 border border-link-line bg-link-soft text-link-deep transition-colors group-hover:bg-[#D4E6F8]">
          {panelli ? "Takas Panelim" : "Nasıl çalışır"}
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="hidden sm:block">
            <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </Link>
    </section>
  );
}
