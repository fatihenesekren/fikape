import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { takasPanelKapisi } from "@/lib/takasPanelKapisi";
import { AramaListesi, type AramaSatiri } from "../_components/AramaListesi";

export const metadata: Metadata = { title: "Kayıtlı Aramalarım · Takas Panelim", robots: { index: false } };

const SINIR = 20; // api/saved-searches/route.ts MAX_KAYITLI_ARAMA ile aynı

// Takas Panelim > Kayıtlı Aramalarım. Yalnız oturum gerekir: aracı olmayan üye de arama kaydedebilmeli (asıl kitle onlar).
// Aramalar /takas'taki "Bu aramayı kaydet" çubuğundan oluşturulur; burada listelenir ve silinir.
export default async function AramalarimPage() {
  const { userId } = await takasPanelKapisi("/takas-panelim/aramalar", "aramalar");

  const [aramalar, aracVar] = await Promise.all([
    prisma.savedSearch
      .findMany({
        where: { userId },
        include: { category: { select: { name: true, slug: true } }, brand: { select: { name: true, slug: true } } },
        orderBy: { createdAt: "desc" },
      })
      .catch(() => null),
    prisma.userProduct.findFirst({ where: { userId, ownershipStatus: "CURRENT" }, select: { id: true } }).catch(() => null),
  ]);

  // Panele hakkı olmayan üye (araç/ilan/görüşme/arama yok) panele dönmek yerine Takas Pazarına döner.
  const panelVar = aracVar != null || (aramalar?.length ?? 0) > 0;

  const satirlar: AramaSatiri[] = (aramalar ?? []).map((a) => ({
    arama: a,
    kaydedildi: a.createdAt.toLocaleDateString("tr-TR", { timeZone: "Europe/Istanbul", day: "numeric", month: "long", year: "numeric" }),
  }));

  return (
    <div className="max-w-3xl w-full mx-auto px-4 py-10 space-y-6">
      <div>
        <Link
          href={panelVar ? "/takas-panelim" : "/takas"}
          className="inline-flex items-center min-h-9 text-sm font-semibold text-gray-600 hover:text-gray-900"
        >
          <span aria-hidden="true">←&nbsp;</span>
          {panelVar ? "Takas Panelim" : "Takas Pazarı"}
        </Link>
        <h1 className="mt-2 text-2xl sm:text-3xl font-black tracking-tight text-gray-900">Kayıtlı Aramalarım</h1>
        <p className="mt-1.5 text-sm text-gray-600 leading-relaxed">
          Kayıtlı aramanıza uyan yeni bir ilan yayınlandığında bildirim zilinde haber alırsınız. Zaten yayındaki ilanlar için bildirim
          gönderilmez; onları “İlanları göster” ile görebilirsiniz.
        </p>
      </div>

      {aramalar === null ? (
        <p className="text-sm text-gray-700 bg-gray-50 border border-gray-100 rounded-2xl p-5" role="alert">
          Kayıtlı aramalarınız şu anda yüklenemedi. Lütfen sayfayı yenileyin.
        </p>
      ) : (
        <>
          <AramaListesi baslangic={satirlar} sinir={SINIR} />
          {satirlar.length > 0 && (
            <p className="text-sm text-gray-600">
              Yeni bir arama kaydetmek için{" "}
              <Link href="/takas" className="font-semibold text-link hover:underline">
                Takas Pazarında
              </Link>{" "}
              filtreleri seçip “Bu aramayı kaydet” düğmesine basın.
            </p>
          )}
        </>
      )}
    </div>
  );
}
