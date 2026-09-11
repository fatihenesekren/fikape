import { NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { rateLimitByIp } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

const RATE_LIMIT_COUNT = 60;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;

// MODEL seviyesi arama — Usta Görüşü yazarken kullanılır (usta notu Product/trim
// değil, MODEL'e bağlanır). /api/search/products'ın model-düzeyi karşılığı:
// aynı unaccent + pg_trgm typo-toleranslı yaklaşım.
export async function GET(req: Request) {
  if (!(await rateLimitByIp(req, "search", RATE_LIMIT_COUNT, RATE_LIMIT_WINDOW_MS))) {
    return NextResponse.json({ error: "Çok fazla istek. Lütfen biraz yavaşlayın." }, { status: 429 });
  }

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return NextResponse.json([]);

  const terms = q.split(/\s+/).filter(Boolean).slice(0, 5);
  const termClauses = terms.map((term) => {
    const pattern = `%${term}%`;
    return Prisma.sql`(
      unaccent(m.name) ILIKE unaccent(${pattern})
      OR unaccent(b.name) ILIKE unaccent(${pattern})
    )`;
  });

  const exact = await prisma.$queryRaw<ModelRow[]>`
    SELECT m.id, m.slug, m.name AS "modelName", b.name AS "brandName",
           (SELECT c.slug FROM "products" p2
              JOIN "categories" c ON c.id = p2."categoryId"
             WHERE p2."modelId" = m.id AND p2."isActive" = true
             ORDER BY p2."weeklyViewCount" DESC LIMIT 1) AS "categorySlug",
           COALESCE((SELECT SUM(p3."weeklyViewCount") FROM "products" p3 WHERE p3."modelId" = m.id), 0) AS "weeklyViews"
    FROM "models" m
    JOIN "brands" b ON b.id = m."brandId"
    WHERE m."isActive" = true
      AND EXISTS (SELECT 1 FROM "products" p WHERE p."modelId" = m.id AND p."isActive" = true)
      AND ${Prisma.join(termClauses, " AND ")}
    ORDER BY "weeklyViews" DESC
    LIMIT 10
  `;

  const rows = exact.length > 0 ? exact : await prisma.$queryRaw<ModelRow[]>`
    SELECT m.id, m.slug, m.name AS "modelName", b.name AS "brandName",
           (SELECT c.slug FROM "products" p2
              JOIN "categories" c ON c.id = p2."categoryId"
             WHERE p2."modelId" = m.id AND p2."isActive" = true
             ORDER BY p2."weeklyViewCount" DESC LIMIT 1) AS "categorySlug",
           0 AS "weeklyViews"
    FROM "models" m
    JOIN "brands" b ON b.id = m."brandId"
    WHERE m."isActive" = true
      AND EXISTS (SELECT 1 FROM "products" p WHERE p."modelId" = m.id AND p."isActive" = true)
      AND (unaccent(b.name) % unaccent(${q}) OR unaccent(m.name) % unaccent(${q}))
    ORDER BY GREATEST(similarity(unaccent(b.name), unaccent(${q})), similarity(unaccent(m.name), unaccent(${q}))) DESC
    LIMIT 10
  `;

  return NextResponse.json(
    rows.map((r) => ({
      id: Number(r.id),
      slug: r.slug,
      brandName: r.brandName,
      modelName: r.modelName,
      categorySlug: r.categorySlug ?? null,
    }))
  );
}

interface ModelRow {
  id: bigint | number;
  slug: string;
  modelName: string;
  brandName: string;
  categorySlug: string | null;
  weeklyViews: bigint | number;
}
