import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ReviewForm } from "./ReviewForm";

export const metadata = { title: "Yorum Yaz — fikape" };

export default async function YorumYazPage({
  searchParams,
}: {
  searchParams: Promise<{ arac?: string }>;
}) {
  const session = await auth();
  if (!session) {
    redirect("/giris?callbackUrl=/yorum-yaz");
  }

  const { arac } = await searchParams;

  const products = await prisma.product.findMany({
    where: { isActive: true },
    select: {
      slug: true,
      name: true,
      trimName: true,
      year: true,
      imageUrl: true,
      attributes: true,
      category: { select: { slug: true } },
      model: {
        select: {
          name: true,
          brand: { select: { name: true } },
        },
      },
    },
    orderBy: [
      { model: { brand: { name: "asc" } } },
      { model: { name: "asc" } },
      { name: "asc" },
    ],
  });

  const mapped = products.map((p) => {
    const attrs = p.attributes as Record<string, unknown>;
    return {
      slug:         p.slug,
      name:         p.name,
      brandName:    p.model.brand.name,
      modelName:    p.model.name,
      trimName:     p.trimName ?? null,
      year:         p.year ?? null,
      imageUrl:     p.imageUrl ?? null,
      fuelType:     (attrs.fuel_type as string | undefined) ?? null,
      bodyType:     (attrs.body_type as string | undefined) ?? null,
      categorySlug: p.category?.slug ?? null,
    };
  });

  return <ReviewForm products={mapped} defaultSlug={arac} />;
}
