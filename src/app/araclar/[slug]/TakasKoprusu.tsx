import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { isTradeListingEnabled } from "@/lib/features";
import { takasUygunlukGetir, takasSonrakiAdim } from "@/lib/takasUygunluk";
import { TakasSartKarti } from "@/app/garajim/TakasSartKarti";

// Araç sayfasında, aracı garajında tutan üyeye: "bu aracı takasa açmaya ne kadar yakınsınız?".
// Yalnızca sahibine gösterilir (niyeti güçlü; misafire ve aracı olmayan üyeye kart gürültü olurdu —
// onlara yalnızca ilan varsa hero'daki "N takas ilanı var" rozeti gösterilir). Sunucu bileşeni;
// sayfa akışını bloklamasın diye çağıran yerde <Suspense> içinde kullanılır. Aracın zaten aktif
// ilanı varsa hiçbir şey göstermez (ilan yönetimi Garajım'da).
export async function TakasKoprusu({
  userId,
  productId,
  productSlug,
  modeldekiIlanSayisi,
}: {
  userId: number;
  productId: number;
  productSlug: string;
  modeldekiIlanSayisi: number;
}) {
  if (!isTradeListingEnabled()) return null;

  const kayit = await prisma.userProduct
    .findUnique({
      where: { userId_productId: { userId, productId } },
      select: { id: true, ownershipStatus: true, tradeListings: { where: { isActive: true }, select: { id: true }, take: 1 } },
    })
    .catch(() => null);
  if (!kayit || kayit.ownershipStatus !== "CURRENT" || kayit.tradeListings.length > 0) return null;

  const uygunluk = await takasUygunlukGetir(userId, kayit.id).catch(() => null);
  if (!uygunluk) return null;

  const garajHref = `/garajim#arac-${kayit.id}`;

  if (uygunluk.uygun) {
    return (
      <div className="bg-white border border-gray-100 rounded-2xl px-5 py-4 flex items-center justify-between gap-3 flex-wrap">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-gray-900">
            <span aria-hidden="true">🔄 </span>
            Aracınızı takasa açabilirsiniz
          </p>
          <p className="mt-0.5 text-xs text-gray-600">
            {modeldekiIlanSayisi === 0
              ? "Bu modelde henüz ilan yok. İlk ilanı siz verebilirsiniz."
              : `Bu modelde ${modeldekiIlanSayisi} takas ilanı var.`}
          </p>
        </div>
        <Link
          href={garajHref}
          className="shrink-0 inline-flex items-center justify-center min-h-11 px-5 rounded-xl text-sm font-semibold text-white"
          style={{ background: "var(--btn-dark)" }}
        >
          Takasa açın →
        </Link>
      </div>
    );
  }

  return <TakasSartKarti className="" adimlar={uygunluk.adimlar} sonraki={takasSonrakiAdim(uygunluk, productSlug)} />;
}
