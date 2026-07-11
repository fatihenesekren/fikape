import { prisma } from "@/lib/prisma";
import { sendNewModelInBrandEmail } from "@/lib/email";
import { stripGenRangeAnywhere } from "@/lib/modelDisplay";

/**
 * Garajında aynı markadan bir araç olan (ama bu ürünün kendisi olmayan)
 * kullanıcılara, markaya yeni bir model eklendiğinde bildirim gönderir.
 * Best-effort — hata olursa admin onay akışını bozmaz.
 */
export async function notifyGarageBrandFollowers(newProductId: number) {
  try {
    const product = await prisma.product.findUnique({
      where: { id: newProductId },
      select: { id: true, name: true, slug: true, brandId: true, brand: { select: { name: true } } },
    });
    if (!product) return;

    const followers = await prisma.userProduct.findMany({
      where: {
        ownershipStatus: "CURRENT",
        product: { brandId: product.brandId, id: { not: product.id } },
      },
      select: { user: { select: { id: true, email: true, displayName: true } } },
      distinct: ["userId"],
    });

    for (const f of followers) {
      await sendNewModelInBrandEmail({
        to: f.user.email,
        displayName: f.user.displayName,
        brandName: product.brand.name,
        vehicleName: stripGenRangeAnywhere(product.name),
        productSlug: product.slug,
        userId: f.user.id,
      }).catch(() => {});
    }
  } catch {
    // best-effort — bildirim başarısız olsa da admin onay akışı etkilenmemeli
  }
}
