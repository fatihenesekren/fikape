import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimitByIp } from "@/lib/rateLimit";
import { BASE_URL } from "@/lib/baseUrl";

export const dynamic = "force-dynamic";

const RATE_LIMIT_COUNT = 30;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;

function withCors(res: NextResponse) {
  res.headers.set("Access-Control-Allow-Origin", "*");
  return res;
}

export async function OPTIONS() {
  return withCors(new NextResponse(null, { status: 204 }));
}

export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  if (!rateLimitByIp(req, "public-skor-api", RATE_LIMIT_COUNT, RATE_LIMIT_WINDOW_MS)) {
    return withCors(NextResponse.json({ error: "Çok fazla istek. Lütfen biraz yavaşlayın." }, { status: 429 }));
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
    return withCors(NextResponse.json({ error: "Araç bulunamadı" }, { status: 404 }));
  }

  const agg = await prisma.review.aggregate({
    where: { product: { slug }, status: "PUBLISHED" },
    _avg: { scoreOverall: true },
    _count: { id: true },
  });

  const reviewCount = agg._count.id;
  const score = reviewCount > 0 ? Math.round((agg._avg.scoreOverall ?? 0) * 10) / 10 : null;

  return withCors(
    NextResponse.json({
      product: `${product.brand.name} ${product.model.name}${product.year ? ` ${product.year}` : ""}${product.trimName ? ` ${product.trimName}` : ""}`,
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
}
