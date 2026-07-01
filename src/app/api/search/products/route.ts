import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() ?? "";

  if (q.length < 2) return NextResponse.json([]);

  const terms = q.split(/\s+/).filter(Boolean).slice(0, 5);

  const products = await prisma.product.findMany({
    where: {
      isActive: true,
      AND: terms.map((term) => ({
        OR: [
          { name:  { contains: term, mode: "insensitive" } },
          { model: { name: { contains: term, mode: "insensitive" } } },
          { model: { brand: { name: { contains: term, mode: "insensitive" } } } },
        ],
      })),
    },
    select: {
      slug: true,
      name: true,
      year: true,
      trimName: true,
      imageUrl: true,
      attributes: true,
      model: { select: { name: true, brand: { select: { name: true } } } },
      category: { select: { slug: true } },
    },
    orderBy: [{ weeklyViewCount: "desc" }, { viewCount: "desc" }],
    take: 10,
  });

  return NextResponse.json(
    products.map((p) => {
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
    })
  );
}
