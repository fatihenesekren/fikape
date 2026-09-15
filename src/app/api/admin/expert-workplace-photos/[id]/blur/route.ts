import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { put } from "@vercel/blob";

export const runtime = "nodejs";

// Usta çalışma yeri fotoğrafı için bulanıklaştırma — api/admin/photos/blur ile
// birebir aynı desen (FormData → blob'a yeniden yükle → DB satırının url'ini
// güncelle). Kullanıcı isteği: araç/yorum fotoğraflarındaki blurlama admin
// onayında burada da olsun (plaka/yüz gibi hassas bölgeler için).
export async function POST(
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

  const photo = await prisma.expertWorkplacePhoto.findUnique({
    where: { id: photoId },
    select: { id: true },
  });
  if (!photo) return NextResponse.json({ error: "Fotoğraf bulunamadı." }, { status: 404 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "Eksik parametre." }, { status: 400 });

  const filename = `expert-workplace/blurred/${Date.now()}.jpg`;
  const blob = await put(filename, file, { access: "public" });

  await prisma.expertWorkplacePhoto.update({
    where: { id: photoId },
    data: { url: blob.url },
  });

  return NextResponse.json({ url: blob.url });
}
