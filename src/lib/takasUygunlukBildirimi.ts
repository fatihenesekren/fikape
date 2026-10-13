import { prisma } from "@/lib/prisma";
import { isTradeListingEnabled, isTradeEligibleNotifyEnabled } from "@/lib/features";
import { createNotification } from "@/lib/notification";
import { takasUygunlukGetir } from "@/lib/takasUygunluk";
import { stripGenRangeAnywhere } from "@/lib/modelDisplay";

// Yorum fotoğrafı onaylandığında (api/admin/reviews/[id]): araç artık takasa açılabilir hâle geldiyse
// kullanıcıya TEK bir site içi bildirim gider. Koşul "foto onaylandı" değil "uygunluk gerçekten oluştu":
// aracın garajda olması, kuralın yeniden hesaplanması, kullanıcının banlı olmaması, aracın hiç ilanı
// olmaması (açmış/kapatmış kişiyi rahatsız etmeyiz) ve özelliklerin açık olması. İki onay yolu da (ilk
// yayın ve sonradan eklenen fotoğraf) aynı yardımcıyı çağırır; tekrarı bildirim bağlantısındaki araç
// kimliğiyle engellenir (araç başına en fazla bir kez). Hata moderasyon isteğini bozmaz.
//
// E-posta YOK: bu bir tanıtım niteliği taşıyabilir (ETK), tek tıkla abonelikten çıkış altyapısı yok.
export async function takasAcilabilirBildirimiGonder(reviewId: number): Promise<void> {
  try {
    if (!isTradeListingEnabled() || !isTradeEligibleNotifyEnabled()) return;

    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      select: {
        userId: true,
        userProductId: true,
        user: { select: { isBanned: true } },
        userProduct: { select: { product: { select: { name: true } } } },
      },
    });
    // Garajla bağlanmamış yorum hiçbir araca uygunluk kazandırmaz.
    if (!review?.userProductId || !review.userProduct || review.user.isBanned) return;

    const uygunluk = await takasUygunlukGetir(review.userId, review.userProductId);
    if (!uygunluk?.uygun) return;

    const [ilanVarMi, oncekiBildirim] = await Promise.all([
      prisma.tradeListing.findFirst({ where: { userProductId: review.userProductId }, select: { id: true } }),
      prisma.notification.findFirst({
        where: { userId: review.userId, type: "TRADE_ELIGIBLE", link: baglanti(review.userProductId) },
        select: { id: true },
      }),
    ]);
    if (ilanVarMi || oncekiBildirim) return;

    await createNotification({
      userId: review.userId,
      type: "TRADE_ELIGIBLE",
      message: `${stripGenRangeAnywhere(review.userProduct.product.name)} için gerekli adımlar tamamlandı. Aracınızı artık takasa açabilirsiniz.`,
      link: baglanti(review.userProductId),
    });
  } catch (e) {
    console.error("[takas-uygunluk-bildirimi]", e);
  }
}

function baglanti(userProductId: number): string {
  return `/garajim#arac-${userProductId}`;
}
