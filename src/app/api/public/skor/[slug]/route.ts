import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimitByIpDetailed } from "@/lib/rateLimit";
import { BASE_URL } from "@/lib/baseUrl";
import { stripModelGenRange } from "@/lib/modelDisplay";

export const dynamic = "force-dynamic";

const RATE_LIMIT_COUNT = 30;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;

function withCors(res: NextResponse) {
  res.headers.set("Access-Control-Allow-Origin", "*");
  return res;
}

function withRateLimitHeaders(res: NextResponse, remaining: number, resetAt: number) {
  res.headers.set("X-RateLimit-Limit", String(RATE_LIMIT_COUNT));
  res.headers.set("X-RateLimit-Remaining", String(remaining));
  res.headers.set("X-RateLimit-Reset", String(Math.ceil(resetAt / 1000)));
  return res;
}

export async function OPTIONS() {
  return withCors(new NextResponse(null, { status: 204 }));
}

export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const rateLimit = await rateLimitByIpDetailed(req, "public-skor-api", RATE_LIMIT_COUNT, RATE_LIMIT_WINDOW_MS);
    if (!rateLimit.allowed) {
      const retryAfterSeconds = Math.max(1, Math.ceil((rateLimit.resetAt - Date.now()) / 1000));
      const res = withCors(
        NextResponse.json({ error: "Çok fazla istek. Lütfen biraz yavaşlayın." }, { status: 429 })
      );
      res.headers.set("Retry-After", String(retryAfterSeconds));
      return withRateLimitHeaders(res, rateLimit.remaining, rateLimit.resetAt);
    }

    const { slug } = await params;
    const product = await prisma.product.findUnique({
      where: { slug, isActive: true },
      select: {
        slug: true,
        year: true,
        trimName: true,
        brand: { select: { name: true } },
        model: { select: { name: true } },
        category: { select: { slug: true, name: true } },
      },
    });

    if (!product) {
      const res = withCors(NextResponse.json({ error: "Araç bulunamadı" }, { status: 404 }));
      return withRateLimitHeaders(res, rateLimit.remaining, rateLimit.resetAt);
    }

    const agg = await prisma.review.aggregate({
      where: { product: { slug }, status: "PUBLISHED" },
      _avg: { scoreOverall: true },
      _count: { id: true },
    });

    const reviewCount = agg._count.id;
    const score = reviewCount > 0 ? Math.round((agg._avg.scoreOverall ?? 0) * 10) / 10 : null;

    const res = withCors(
      NextResponse.json({
        product: `${product.brand.name} ${stripModelGenRange(product.model.name)}${product.year ? ` ${product.year}` : ""}${product.trimName ? ` ${product.trimName}` : ""}`,
        category: product.category?.name ?? null,
        score,
        scoreLabel: score !== null ? `${score}/10` : "Veri birikiyor",
        reviewCount,
        url: `${BASE_URL}/araclar/${product.slug}`,
        badgeUrl: `${BASE_URL}/api/public/skor/${product.slug}/badge.png`,
        attribution: "Veri fikape.com kullanıcı yorumlarına dayanır. Kullanırken araç sayfasına link vermeniz gerekir.",
        generatedAt: new Date().toISOString(),
      })
    );
    return withRateLimitHeaders(res, rateLimit.remaining, rateLimit.resetAt);
  } catch (e) {
    // İç hata detayı (Prisma mesajı/stack) response'a asla sızdırılmaz — sadece
    // sunucu tarafında loglanır, çağırana jenerik mesaj döner.
    console.error("[public-skor-api] Beklenmeyen hata:", e);
    return withCors(
      NextResponse.json({ error: "Sunucu hatası, lütfen daha sonra tekrar deneyin." }, { status: 500 })
    );
  }
}
