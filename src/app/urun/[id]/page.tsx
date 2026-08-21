import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

// Bildirimlerdeki ürün linkleri artık slug'ı gömmek yerine buraya (id-bazlı,
// kalıcı) yönleniyor — katalog bakımı sırasında bir ürünün slug'ı değiştiğinde
// (bkz. trimName/HP temizliği, nesil ayrımı gibi geçmiş düzenlemeler) eski
// bildirimlerin linki artık kırılmıyor, her zaman GÜNCEL slug'a yönlendiriyor.
export default async function ProductRedirectPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const productId = parseInt(id);
  if (isNaN(productId)) notFound();

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { slug: true },
  });
  if (!product) notFound();

  const search = await searchParams;
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(search)) {
    if (typeof value === "string") query.set(key, value);
  }
  const qs = query.toString();

  redirect(`/araclar/${product.slug}${qs ? `?${qs}` : ""}`);
}
