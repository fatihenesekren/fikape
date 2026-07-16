import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { sendReviewPublishedEmail } from "@/lib/email";
import { createNotification } from "@/lib/notification";
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

  const existingReview = await prisma.review.findUnique({
    where: { id: reviewId },
    select: { status: true },
  });
  if (!existingReview) {
    return NextResponse.json({ error: "Yorum bulunamadı." }, { status: 404 });
  }

  // Yorumun kendisi zaten yayında — buradaki bekleyen fotoğraflar, onaylı bir
  // yorum düzenlenirken sonradan eklenmiş demektir. Yorumun durumuna/puanına/
  // trustScore'una dokunmadan sadece bu fotoğrafları onayla/reddet.
  if (existingReview.status === "PUBLISHED") {
    if (action === "approve") {
      const pendingPhotos = await prisma.productPhoto.findMany({
        where: { reviewId, status: "PENDING" },
        select: { id: true },
      });
      if (pendingPhotos.length === 0) {
        return NextResponse.json({ error: "Onay bekleyen fotoğraf yok." }, { status: 409 });
      }

      const review = await prisma.review.findUnique({
        where: { id: reviewId },
        select: { userId: true, user: { select: { trustLevel: true } } },
      });

      await prisma.$transaction([
        prisma.productPhoto.updateMany({ where: { reviewId, status: "PENDING" }, data: { status: "APPROVED" } }),
        ...(review && review.user.trustLevel === 2
          ? [prisma.user.updateMany({ where: { id: review.userId, trustLevel: 2 }, data: { trustLevel: 3 } })]
          : []),
      ]);

      await recordModerationLog({ reviewId, moderatorId, action: "APPROVED", reason: "Sonradan eklenen fotoğraf(lar) onaylandı" });
      return NextResponse.json({ ok: true, status: "PUBLISHED" });
    }

    if (action === "reject") {
      const result = await prisma.productPhoto.updateMany({ where: { reviewId, status: "PENDING" }, data: { status: "REJECTED" } });
      if (result.count === 0) {
        return NextResponse.json({ error: "Reddedilecek fotoğraf yok." }, { status: 409 });
      }

      await recordModerationLog({ reviewId, moderatorId, action: "REJECTED", reason: reason || "Sonradan eklenen fotoğraf(lar) reddedildi" });
      return NextResponse.json({ ok: true, status: "PUBLISHED" });
    }

    return NextResponse.json({ error: "Geçersiz işlem." }, { status: 400 });
  }

  if (existingReview.status !== "PENDING") {
    return NextResponse.json({ error: "Bu yorum bu işlem için uygun durumda değil." }, { status: 409 });
  }

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

    if (review) {
      const vehicleName = `${review.product.brand.name} ${stripModelGenRange(review.product.model.name)}`;
      if (review.user.email) {
        sendReviewPublishedEmail({
          to: review.user.email,
          displayName: review.user.displayName,
          vehicleName,
          reviewId,
          userId: review.userId,
        }).catch(() => {});
      }
      createNotification({
        userId: review.userId,
        type: "REVIEW_PUBLISHED",
        message: `${vehicleName} için yazdığın yorum yayınlandı`,
        link: `/yorumum/${reviewId}/paylas`,
      });
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
