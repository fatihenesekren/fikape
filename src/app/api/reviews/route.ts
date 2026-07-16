import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { calcOverall } from "@/lib/fikape";
import { validateDetailShort } from "@/lib/reviewValidation";
import { hashRequestContext, recordScoreSnapshot } from "@/lib/security";
import { computePHash } from "@/lib/phash";
import { reviewCreateSchema, formatZodError } from "@/lib/schemas";
import { calcTrustScore } from "@/lib/trustScore";

const RATE_LIMIT_COUNT = 5;
const RATE_LIMIT_WINDOW_MS = 24 * 60 * 60 * 1000;

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Giriş gerekli." }, { status: 401 });

  const parsed = reviewCreateSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 });
  }
  const {
    productSlug, scoreFiyat, scoreKalite, scorePerformans,
    summaryText, detailText, wouldBuyAgain, ownershipMonths, extendedData,
    pros: prosArr, cons: consArr, photoUrls,
  } = parsed.data;

  const detailCheck = validateDetailShort(detailText ?? "");
  if (!detailCheck.ok) {
    return NextResponse.json({ error: detailCheck.error }, { status: 400 });
  }

  const userId = parseInt(session.user.id);

  const [product, user, recentCount, garajEntry] = await Promise.all([
    prisma.product.findUnique({ where: { slug: productSlug }, select: { id: true } }),
    prisma.user.findUnique({ where: { id: userId }, select: { emailVerifiedAt: true, trustLevel: true } }),
    prisma.review.count({
      where: {
        userId,
        createdAt: { gte: new Date(Date.now() - RATE_LIMIT_WINDOW_MS) },
      },
    }),
    prisma.userProduct.findFirst({
      where: { userId, product: { slug: productSlug } },
      select: { id: true },
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

  const pros = prosArr ?? [];
  const cons = consArr ?? [];

  const mergedExtended = {
    ...(extendedData && Object.keys(extendedData).length ? extendedData : {}),
    pros,
    cons,
    // Sıfır-sürtünmeli hızlı puan: chip seçilmeden gönderildi, sonra güçlendirme nudge'ı için işaretle
    ...(pros.length === 0 && cons.length === 0 ? { quickReview: true } : {}),
  };

  const { ipHash, userAgentHash } = hashRequestContext(req);

  const trustScore = calcTrustScore({ trustLevel: user.trustLevel, garajLinked: !!garajEntry });

  const review = await prisma.review.create({
    data: {
      userId,
      productId:   product.id,
      userProductId: garajEntry?.id ?? null,
      scoreFiyat,
      scoreKalite,
      scorePerformans,
      scoreOverall,
      summaryText:             summaryText?.trim() ?? "",
      detailText:              detailText?.trim() || null,
      wouldBuyAgain:           wouldBuyAgain ?? null,
      ownershipMonthsAtReview: ownershipMonths ? Number(ownershipMonths) : null,
      extendedData:            mergedExtended,
      status:                  "PENDING",
      ipHash,
      userAgentHash,
      trustScore,
    },
  });

  await recordScoreSnapshot({
    reviewId: review.id,
    productId: product.id,
    trustScore: review.trustScore,
    scoreOverall,
    status: "PENDING",
    reason: "CREATED",
  });

  // Fotoğraflar varsa ProductPhoto kaydı oluştur (PENDING — admin onaylar)
  const urls: string[] = photoUrls ?? [];
  if (urls.length > 0) {
    // pHash hesaplama best-effort — başarısız olursa fotoğraf yine de kaydedilir, sadece tekrar tespiti atlanır
    const phashes = await Promise.all(
      urls.map(async (url) => {
        try {
          const res = await fetch(url);
          const buffer = Buffer.from(await res.arrayBuffer());
          return await computePHash(buffer);
        } catch {
          return null;
        }
      })
    );

    await prisma.productPhoto.createMany({
      data: urls.map((url, idx) => ({
        productId: product.id,
        uploadedByUserId: userId,
        reviewId: review.id,
        url,
        status: "PENDING",
        order: idx,
        phash: phashes[idx],
      })),
    });
  }

  return NextResponse.json({ ok: true, reviewId: review.id }, { status: 201 });
}
