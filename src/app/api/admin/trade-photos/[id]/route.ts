import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notification";
import { deleteTradePhotoBlobs } from "@/lib/tradeListingPhotos";

// Takas ilanı fotoğrafı moderasyonu — tek fotoğraf onay/red.
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Yetkisiz." }, { status: 403 });

  const adminUser = await prisma.user.findUnique({
    where: { id: Number(session.user.id) },
    select: { trustLevel: true },
  });
  if (!adminUser || adminUser.trustLevel < 5) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 403 });
  }

  const { id } = await params;
  const photoId = parseInt(id);
  if (isNaN(photoId)) return NextResponse.json({ error: "Fotoğraf bulunamadı." }, { status: 404 });

  const { action } = (await req.json().catch(() => ({}))) as { action?: "approve" | "reject" };
  if (action !== "approve" && action !== "reject") {
    return NextResponse.json({ error: "Geçersiz işlem." }, { status: 400 });
  }

  const photo = await prisma.tradeListingPhoto.findUnique({
    where: { id: photoId },
    select: {
      id: true, status: true, url: true, tradeListingId: true,
      tradeListing: { select: { userId: true } },
    },
  });
  if (!photo) return NextResponse.json({ error: "Fotoğraf bulunamadı." }, { status: 404 });
  if (photo.status !== "PENDING") {
    return NextResponse.json({ error: "Bu fotoğraf zaten işleme alınmış." }, { status: 409 });
  }

  const link = `/takas/${photo.tradeListingId}`;

  if (action === "approve") {
    await prisma.tradeListingPhoto.update({ where: { id: photoId }, data: { status: "APPROVED" } });
    createNotification({
      userId: photo.tradeListing.userId,
      type: "TRADE_PHOTO_MODERATED",
      message: "Takas ilanı fotoğrafınız onaylandı ve yayında.",
      link,
    }).catch(() => {});
    return NextResponse.json({ ok: true, status: "APPROVED" });
  }

  // reject — satır REJECTED, blob best-effort silinir.
  await prisma.tradeListingPhoto.update({ where: { id: photoId }, data: { status: "REJECTED" } });
  deleteTradePhotoBlobs([photo.url]).catch(() => {});
  createNotification({
    userId: photo.tradeListing.userId,
    type: "TRADE_PHOTO_MODERATED",
    message: "Takas ilanı fotoğraflarınızdan biri yayınlanmadı (kural dışı içerik / plaka / kişisel veri).",
    link,
  }).catch(() => {});
  return NextResponse.json({ ok: true, status: "REJECTED" });
}
