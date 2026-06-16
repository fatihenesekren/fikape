import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { calcOverall } from "@/lib/fikape";

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Giriş gerekli." }, { status: 401 });

  const {
    productSlug, scoreFiyat, scoreKalite, scorePerformans,
    summaryText, detailText, wouldBuyAgain, ownershipMonths,
  } = await req.json();

  if (!productSlug || !summaryText?.trim()) {
    return NextResponse.json({ error: "Araç ve özet zorunludur." }, { status: 400 });
  }
  if ([scoreFiyat, scoreKalite, scorePerformans].some((s) => s < 1 || s > 5)) {
    return NextResponse.json({ error: "Puanlar 1-5 arasında olmalıdır." }, { status: 400 });
  }

  const product = await prisma.product.findUnique({ where: { slug: productSlug } });
  if (!product) return NextResponse.json({ error: "Araç bulunamadı." }, { status: 404 });

  const userId = parseInt(session.user.id);
  const scoreOverall = calcOverall({ scoreFiyat, scoreKalite, scorePerformans });

  const review = await prisma.review.create({
    data: {
      userId,
      productId:   product.id,
      scoreFiyat,
      scoreKalite,
      scorePerformans,
      scoreOverall,
      summaryText:              summaryText.trim(),
      detailText:               detailText?.trim() || null,
      wouldBuyAgain:            wouldBuyAgain ?? null,
      ownershipMonthsAtReview:  ownershipMonths ? parseInt(ownershipMonths) : null,
      status:                   "PENDING",
    },
  });

  return NextResponse.json({ ok: true, reviewId: review.id }, { status: 201 });
}
