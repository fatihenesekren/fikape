import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { sendReviewPublishedEmail } from "@/lib/email";
import { recordScoreSnapshot, recordModerationLog } from "@/lib/security";
import { calcTrustScore } from "@/lib/trustScore";
import { stripModelGenRange } from "@/lib/modelDisplay";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || (session.user.trustLevel as number) < 5) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 403 });
  }

  const { id } = await params;
  const reviewId = parseInt(id);
  const moderatorId = parseInt(session.user.id);
  const { action, reason } = await req.json() as { action: "approve" | "reject"; reason?: string };

  if (action === "approve") {
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      select: {
        userId: true,
        productId: true,
        trustScore: true,
        scoreOverall: true,
        photos: { where: { status: "PENDING" }, select: { id: true } },
        user: { select: { email: true, displayName: true, trustLevel: true } },
        product: {
          select: {
            brand: { select: { name: true } },
            model: { select: { name: true } },
          },
        },
      },
    });

    const hasPhotos = (review?.photos.length ?? 0) > 0;

    // Onay anında TrustLevel değişmiş olabilir (fotoğraflı yorumla Level 2→3
    // yükselmesi tam bu anda oluyor) — trustScore'u güncel seviyeyle yeniden hesapla.
    let recomputedTrustScore = review?.trustScore ?? 35;
    if (review) {
      const garajEntry = await prisma.userProduct.findFirst({
        where: { userId: review.userId, productId: review.productId },
        select: { id: true },
      });
      const finalTrustLevel = hasPhotos && review.user.trustLevel === 2 ? 3 : review.user.trustLevel;
      recomputedTrustScore = calcTrustScore({ trustLevel: finalTrustLevel, garajLinked: !!garajEntry });
    }

    await prisma.$transaction([
      prisma.review.update({
        where: { id: reviewId },
        data: { status: "PUBLISHED", publishedAt: new Date(), trustScore: recomputedTrustScore },
      }),
      prisma.productPhoto.updateMany({
        where: { reviewId, status: "PENDING" },
        data: { status: "APPROVED" },
      }),
      // Fotoğrafı olan kullanıcıyı Level 2 → 3'e yükselt
      ...(hasPhotos && review?.userId
        ? [prisma.user.updateMany({
            where: { id: review.userId, trustLevel: 2 },
            data: { trustLevel: 3 },
          })]
        : []),
    ]);

    if (review?.user.email) {
      sendReviewPublishedEmail({
        to: review.user.email,
        displayName: review.user.displayName,
        vehicleName: `${review.product.brand.name} ${stripModelGenRange(review.product.model.name)}`,
        reviewId,
      }).catch(() => {});
    }

    if (review) {
      await recordScoreSnapshot({
        reviewId,
        productId: review.productId,
        trustScore: recomputedTrustScore,
        scoreOverall: review.scoreOverall,
        status: "PUBLISHED",
        reason: "PUBLISHED",
      });
    }

    await recordModerationLog({ reviewId, moderatorId, action: "APPROVED" });

    return NextResponse.json({ ok: true, status: "PUBLISHED" });
  }

  if (action === "reject") {
    const review = await prisma.review.update({
      where: { id: reviewId },
      data: { status: "REJECTED", rejectedAt: new Date(), rejectionReason: reason ?? null },
      select: { productId: true, trustScore: true, scoreOverall: true },
    });

    await recordScoreSnapshot({
      reviewId,
      productId: review.productId,
      trustScore: review.trustScore,
      scoreOverall: review.scoreOverall,
      status: "REJECTED",
      reason: "REJECTED",
    });

    await recordModerationLog({ reviewId, moderatorId, action: "REJECTED", reason: reason ?? null });

    return NextResponse.json({ ok: true, status: "REJECTED" });
  }

  return NextResponse.json({ error: "Geçersiz işlem." }, { status: 400 });
}
