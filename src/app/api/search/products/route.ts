import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimitByIp } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

const RATE_LIMIT_COUNT = 60;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;

export async function GET(req: Request) {
  if (!rateLimitByIp(req, "search", RATE_LIMIT_COUNT, RATE_LIMIT_WINDOW_MS)) {
    return NextResponse.json({ error: "Çok fazla istek. Lütfen biraz yavaşlayın." }, { status: 429 });
  }

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

  if (products.length > 0) {
    return NextResponse.json(products.map(serialize));
  }

  // Tam eşleşme yok — pg_trgm ile typo toleranslı benzerlik araması (örn. "toyta" → "Toyota")
  const fuzzy = await prisma.$queryRaw<FuzzyRow[]>`
    SELECT p.slug, p.name, p."trimName", p.year, p."imageUrl", p.attributes,
           m.name AS "modelName", b.name AS "brandName", c.slug AS "categorySlug"
    FROM "products" p
    JOIN "models" m ON m.id = p."modelId"
    JOIN "brands" b ON b.id = p."brandId"
    LEFT JOIN "categories" c ON c.id = p."categoryId"
    WHERE p."isActive" = true
      AND (b.name % ${q} OR m.name % ${q} OR p.name % ${q})
    ORDER BY GREATEST(similarity(b.name, ${q}), similarity(m.name, ${q}), similarity(p.name, ${q})) DESC
    LIMIT 10
  `;

  return NextResponse.json(fuzzy.map(serialize));
}

interface FuzzyRow {
  slug: string;
  name: string;
  trimName: string | null;
  year: number | null;
  imageUrl: string | null;
  attributes: unknown;
  modelName: string;
  brandName: string;
  categorySlug: string | null;
}

function serialize(p: FuzzyRow | {
  slug: string; name: string; year: number | null; trimName: string | null;
  imageUrl: string | null; attributes: unknown;
  model: { name: string; brand: { name: string } };
  category: { slug: string } | null;
}) {
  const attrs = p.attributes as Record<string, unknown>;
  const brandName = "brandName" in p ? p.brandName : p.model.brand.name;
  const modelName = "modelName" in p ? p.modelName : p.model.name;
  const categorySlug = "categorySlug" in p ? p.categorySlug : (p.category?.slug ?? null);

  return {
    slug:         p.slug,
    name:         p.name,
    brandName,
    modelName,
    trimName:     p.trimName ?? null,
    year:         p.year ?? null,
    imageUrl:     p.imageUrl ?? null,
    fuelType:     (attrs.fuel_type as string | undefined) ?? null,
    bodyType:     (attrs.body_type as string | undefined) ?? null,
    categorySlug: categorySlug ?? null,
  };
}
