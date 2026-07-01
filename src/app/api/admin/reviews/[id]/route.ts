import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

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
  const { action, reason } = await req.json() as { action: "approve" | "reject"; reason?: string };

  if (action === "approve") {
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      select: {
        userId: true,
        photos: { where: { status: "PENDING" }, select: { id: true } },
      },
    });

    const hasPhotos = (review?.photos.length ?? 0) > 0;

    await prisma.$transaction([
      prisma.review.update({
        where: { id: reviewId },
        data: { status: "PUBLISHED", publishedAt: new Date() },
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
    return NextResponse.json({ ok: true, status: "PUBLISHED" });
  }

  if (action === "reject") {
    await prisma.review.update({
      where: { id: reviewId },
      data: { status: "REJECTED", rejectedAt: new Date(), rejectionReason: reason ?? null },
    });
    return NextResponse.json({ ok: true, status: "REJECTED" });
  }

  return NextResponse.json({ error: "Geçersiz işlem." }, { status: 400 });
}
