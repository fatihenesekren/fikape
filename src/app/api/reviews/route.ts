import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { calcOverall } from "@/lib/fikape";
import { validateSummary, validateDetail } from "@/lib/reviewValidation";

const RATE_LIMIT_COUNT = 5;
const RATE_LIMIT_WINDOW_MS = 24 * 60 * 60 * 1000;

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Giriş gerekli." }, { status: 401 });

  const {
    productSlug, scoreFiyat, scoreKalite, scorePerformans,
    summaryText, detailText, wouldBuyAgain, ownershipMonths, extendedData,
  } = await req.json();

  if (!productSlug) {
    return NextResponse.json({ error: "Araç zorunludur." }, { status: 400 });
  }
  if ([scoreFiyat, scoreKalite, scorePerformans].some((s) => s < 1 || s > 10)) {
    return NextResponse.json({ error: "Puanlar 1-10 arasında olmalıdır." }, { status: 400 });
  }

  const summaryCheck = validateSummary(summaryText ?? "");
  if (!summaryCheck.ok) {
    return NextResponse.json({ error: summaryCheck.error }, { status: 400 });
  }
  const detailCheck = validateDetail(detailText ?? "");
  if (!detailCheck.ok) {
    return NextResponse.json({ error: detailCheck.error }, { status: 400 });
  }

  const userId = parseInt(session.user.id);

  const [product, user, recentCount] = await Promise.all([
    prisma.product.findUnique({ where: { slug: productSlug }, select: { id: true } }),
    prisma.user.findUnique({ where: { id: userId }, select: { emailVerifiedAt: true } }),
    prisma.review.count({
      where: {
        userId,
        createdAt: { gte: new Date(Date.now() - RATE_LIMIT_WINDOW_MS) },
      },
    }),
  ]);

  if (!product) return NextResponse.json({ error: "Araç bulunamadı." }, { status: 404 });

  if (!user?.emailVerifiedAt) {
    return NextResponse.json(
      { error: "Yorum yazmak için e-posta adresinizi doğrulamanız gerekiyor." },
      { status: 403 }
    );
  }

  if (recentCount >= RATE_LIMIT_COUNT) {
    return NextResponse.json(
      { error: "Günlük yorum limitine ulaştınız. 24 saat sonra tekrar deneyebilirsiniz." },
      { status: 429 }
    );
  }

  const existing = await prisma.review.findFirst({
    where: {
      userId,
      productId: product.id,
      status: { in: ["PENDING", "PUBLISHED"] },
    },
    select: { id: true },
  });
  if (existing) {
    return NextResponse.json(
      { error: "Bu araç için zaten bir yorumun var. Her araç için tek yorum yazılabilir." },
      { status: 409 }
    );
  }

  const scoreOverall = calcOverall({ scoreFiyat, scoreKalite, scorePerformans });

  const review = await prisma.review.create({
    data: {
      userId,
      productId:   product.id,
      scoreFiyat,
      scoreKalite,
      scorePerformans,
      scoreOverall,
      summaryText:             summaryText.trim(),
      detailText:              detailText?.trim() || null,
      wouldBuyAgain:           wouldBuyAgain ?? null,
      ownershipMonthsAtReview: ownershipMonths ? Number(ownershipMonths) : null,
      extendedData:            extendedData && Object.keys(extendedData).length ? extendedData : undefined,
      status:                  "PENDING",
    },
  });

  return NextResponse.json({ ok: true, reviewId: review.id }, { status: 201 });
}
