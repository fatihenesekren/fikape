import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notification";
import { deleteExpertWorkplacePhotoBlobs } from "@/lib/expertWorkplacePhotos";

// Usta çalışma yeri fotoğrafı moderasyonu — trade-photos route'uyla aynı desen.
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

  const photo = await prisma.expertWorkplacePhoto.findUnique({
    where: { id: photoId },
    select: {
      id: true, status: true, url: true,
      profile: { select: { userId: true, slug: true } },
    },
  });
  if (!photo) return NextResponse.json({ error: "Fotoğraf bulunamadı." }, { status: 404 });
  if (photo.status !== "PENDING") {
    return NextResponse.json({ error: "Bu fotoğraf zaten işleme alınmış." }, { status: 409 });
  }

  const link = `/usta/${photo.profile.slug}`;

  if (action === "approve") {
    await prisma.expertWorkplacePhoto.update({ where: { id: photoId }, data: { status: "APPROVED" } });
    createNotification({
      userId: photo.profile.userId,
      type: "EXPERT_WORKPLACE_PHOTO_MODERATED",
      message: "Çalışma yeri fotoğrafınız onaylandı ve yayında.",
      link,
    }).catch(() => {});
    return NextResponse.json({ ok: true, status: "APPROVED" });
  }

  // reject — satır REJECTED, blob best-effort silinir.
  await prisma.expertWorkplacePhoto.update({ where: { id: photoId }, data: { status: "REJECTED" } });
  deleteExpertWorkplacePhotoBlobs([photo.url]).catch(() => {});
  createNotification({
    userId: photo.profile.userId,
    type: "EXPERT_WORKPLACE_PHOTO_MODERATED",
    message: "Çalışma yeri fotoğraflarınızdan biri yayınlanmadı (kural dışı içerik / plaka / kişisel veri).",
    link: "/usta-gorusu/profil",
  }).catch(() => {});
  return NextResponse.json({ ok: true, status: "REJECTED" });
}
