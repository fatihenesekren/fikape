import { NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma/client";
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

  // unaccent() her iki tarafa da uygulanıyor ki "citroen" → "Citroën", "skoda" → "Škoda"
  // gibi aksan farkları arama sonucunu etkilemesin (Türkçe ş/ğ/ç/ö/ü/ı da normalize olur).
  const termClauses = terms.map((term) => {
    const pattern = `%${term}%`;
    return Prisma.sql`(
      unaccent(p.name) ILIKE unaccent(${pattern})
      OR unaccent(m.name) ILIKE unaccent(${pattern})
      OR unaccent(b.name) ILIKE unaccent(${pattern})
    )`;
  });

  const exact = await prisma.$queryRaw<FuzzyRow[]>`
    SELECT p.slug, p.name, p."trimName", p.year, p."imageUrl", p.attributes,
           m.name AS "modelName", b.name AS "brandName", c.slug AS "categorySlug"
    FROM "products" p
    JOIN "models" m ON m.id = p."modelId"
    JOIN "brands" b ON b.id = p."brandId"
    LEFT JOIN "categories" c ON c.id = p."categoryId"
    WHERE p."isActive" = true
      AND ${Prisma.join(termClauses, " AND ")}
    ORDER BY p."weeklyViewCount" DESC, p."viewCount" DESC
    LIMIT 10
  `;

  if (exact.length > 0) {
    return NextResponse.json(exact.map(serialize));
  }

  // Tam eşleşme yok — pg_trgm ile typo toleranslı benzerlik araması (örn. "toyta" → "Toyota"),
  // burada da unaccent uygulanıyor (aksan + yazım hatası birlikte olursa, örn. "sitroen")
  const fuzzy = await prisma.$queryRaw<FuzzyRow[]>`
    SELECT p.slug, p.name, p."trimName", p.year, p."imageUrl", p.attributes,
           m.name AS "modelName", b.name AS "brandName", c.slug AS "categorySlug"
    FROM "products" p
    JOIN "models" m ON m.id = p."modelId"
    JOIN "brands" b ON b.id = p."brandId"
    LEFT JOIN "categories" c ON c.id = p."categoryId"
    WHERE p."isActive" = true
      AND (
        unaccent(b.name) % unaccent(${q})
        OR unaccent(m.name) % unaccent(${q})
        OR unaccent(p.name) % unaccent(${q})
      )
    ORDER BY GREATEST(
      similarity(unaccent(b.name), unaccent(${q})),
      similarity(unaccent(m.name), unaccent(${q})),
      similarity(unaccent(p.name), unaccent(${q}))
    ) DESC
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
