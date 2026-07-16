import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { validateDetailShort } from "@/lib/reviewValidation";
import { calcOverall } from "@/lib/fikape";
import { recordScoreSnapshot } from "@/lib/security";
import { computePHash } from "@/lib/phash";

const MAX_PHOTOS = 5;

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Giriş gerekli." }, { status: 401 });
  }

  const { id } = await params;
  const reviewId = parseInt(id);
  const userId = parseInt(session.user.id);

  const {
    pros, cons, detailText, wouldBuyAgain, triggerSource,
    scoreFiyat, scoreKalite, scorePerformans,
    extendedData, ownershipMonths, photoUrls, removePhotoIds,
  } = await req.json();

  const prosArr: string[] = Array.isArray(pros) ? pros : [];
  const consArr: string[] = Array.isArray(cons) ? cons : [];
  if (prosArr.length < 1 || prosArr.length > 3) {
    return NextResponse.json({ error: "En az 1, en fazla 3 artı seçiniz." }, { status: 400 });
  }
  if (consArr.length < 1 || consArr.length > 3) {
    return NextResponse.json({ error: "En az 1, en fazla 3 eksi seçiniz." }, { status: 400 });
  }

  const detailCheck = validateDetailShort(detailText ?? "");
  if (!detailCheck.ok) {
    return NextResponse.json({ error: detailCheck.error }, { status: 400 });
  }

  const hasScores =
    typeof scoreFiyat === "number" &&
    typeof scoreKalite === "number" &&
    typeof scorePerformans === "number" &&
    [scoreFiyat, scoreKalite, scorePerformans].every((s) => s >= 1 && s <= 10);

  const review = await prisma.review.findUnique({
    where: { id: reviewId },
    select: {
      userId: true, status: true, extendedData: true, editCount: true,
      scoreFiyat: true, scoreKalite: true, scorePerformans: true,
      productId: true, trustScore: true,
      photos: { select: { id: true }, where: { status: { not: "REJECTED" } } },
    },
  });

  if (!review) return NextResponse.json({ error: "Yorum bulunamadı." }, { status: 404 });
  if (review.userId !== userId) return NextResponse.json({ error: "Yetkisiz." }, { status: 403 });
  if (review.status !== "PUBLISHED" && review.status !== "PENDING") {
    return NextResponse.json({ error: "Bu yorum artık düzenlenemez." }, { status: 409 });
  }

  const newPhotoUrls: string[] = Array.isArray(photoUrls) ? photoUrls.filter((u: unknown) => typeof u === "string") : [];
  const removeIds: number[] = Array.isArray(removePhotoIds) ? removePhotoIds.filter((n: unknown) => typeof n === "number") : [];
  const existingPhotoIds = new Set(review.photos.map((p) => p.id));
  const validRemoveIds = removeIds.filter((rid) => existingPhotoIds.has(rid));
  const remainingExistingCount = review.photos.length - validRemoveIds.length;
  if (remainingExistingCount + newPhotoUrls.length > MAX_PHOTOS) {
    return NextResponse.json({ error: `En fazla ${MAX_PHOTOS} fotoğraf ekleyebilirsiniz.` }, { status: 400 });
  }

  const incomingExtended = (extendedData && typeof extendedData === "object") ? extendedData as Record<string, unknown> : {};
  const existing = (review.extendedData as Record<string, unknown>) ?? {};
  const updatedExtended = { ...existing, ...incomingExtended, pros: prosArr, cons: consArr };
  const newVersion = review.editCount + 1;
  const source = triggerSource === "REMINDER_3M" ? "REMINDER_3M" : "MANUAL";

  const newFiyat      = hasScores ? (scoreFiyat as number)      : review.scoreFiyat;
  const newKalite     = hasScores ? (scoreKalite as number)     : review.scoreKalite;
  const newPerformans = hasScores ? (scorePerformans as number) : review.scorePerformans;
  const newOverall    = calcOverall({ scoreFiyat: newFiyat, scoreKalite: newKalite, scorePerformans: newPerformans });

  const newOwnershipMonths = typeof ownershipMonths === "number" ? ownershipMonths : undefined;

  await prisma.$transaction([
    prisma.review.update({
      where: { id: reviewId },
      data: {
        extendedData:    updatedExtended,
        detailText:      detailText?.trim() || null,
        wouldBuyAgain:   wouldBuyAgain ?? null,
        scoreFiyat:      newFiyat,
        scoreKalite:     newKalite,
        scorePerformans: newPerformans,
        scoreOverall:    newOverall,
        editedAt:        new Date(),
        editCount:       newVersion,
        ...(newOwnershipMonths !== undefined ? { ownershipMonthsAtReview: newOwnershipMonths } : {}),
      },
    }),
    prisma.reviewVersion.create({
      data: {
        reviewId,
        version:         newVersion,
        pros:            prosArr,
        cons:            consArr,
        detailText:      detailText?.trim() || null,
        wouldBuyAgain:   wouldBuyAgain ?? null,
        scoreFiyat:      newFiyat,
        scoreKalite:     newKalite,
        scorePerformans: newPerformans,
        scoreOverall:    newOverall,
        triggerSource:   source,
      },
    }),
    ...(validRemoveIds.length > 0
      ? [prisma.productPhoto.deleteMany({ where: { id: { in: validRemoveIds }, reviewId } })]
      : []),
  ]);

  if (newPhotoUrls.length > 0) {
    // pHash hesaplama best-effort — başarısız olursa fotoğraf yine de kaydedilir
    const phashes = await Promise.all(
      newPhotoUrls.map(async (url) => {
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
      data: newPhotoUrls.map((url, idx) => ({
        productId: review.productId,
        uploadedByUserId: userId,
        reviewId,
        url,
        status: "PENDING",
        order: remainingExistingCount + idx,
        phash: phashes[idx],
      })),
    });
  }

  await recordScoreSnapshot({
    reviewId,
    productId: review.productId,
    trustScore: review.trustScore,
    scoreOverall: newOverall,
    status: review.status,
    reason: "EDITED",
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Giriş gerekli." }, { status: 401 });
  }

  const { id } = await params;
  const reviewId = parseInt(id);
  const userId = parseInt(session.user.id);

  const review = await prisma.review.findUnique({
    where: { id: reviewId },
    select: { userId: true, status: true },
  });

  if (!review) return NextResponse.json({ error: "Yorum bulunamadı." }, { status: 404 });
  if (review.userId !== userId) return NextResponse.json({ error: "Yetkisiz." }, { status: 403 });
  if (review.status === "DELETED") return NextResponse.json({ ok: true });

  await prisma.review.update({
    where: { id: reviewId },
    data: { status: "DELETED" },
  });

  return NextResponse.json({ ok: true });
}
