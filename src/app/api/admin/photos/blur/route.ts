import { NextResponse } from "next/server";
import { pozitifTamsayiId } from "@/lib/validateId";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { put } from "@vercel/blob";
import { yuklenenGorseliDogrula } from "@/lib/yuklenenGorsel";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Yetkisiz." }, { status: 403 });

  const adminUser = await prisma.user.findUnique({
    where: { id: Number(session.user.id) },
    select: { trustLevel: true },
  });
  if (!adminUser || adminUser.trustLevel < 5) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 403 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const photoId = pozitifTamsayiId(formData.get("photoId") as string) ?? NaN;

  if (!file || isNaN(photoId)) {
    return NextResponse.json({ error: "Eksik parametre." }, { status: 400 });
  }

  const foto = await prisma.productPhoto.findUnique({ where: { id: photoId }, select: { id: true } });
  if (!foto) return NextResponse.json({ error: "Fotoğraf bulunamadı." }, { status: 404 });

  const dogrulanan = await yuklenenGorseliDogrula(file);
  if (!dogrulanan.ok) return NextResponse.json({ error: dogrulanan.error }, { status: dogrulanan.status });

  const filename = `reviews/blurred/${Date.now()}.jpg`;
  const blob = await put(filename, dogrulanan.buffer, { access: "public", contentType: "image/jpeg" });

  await prisma.productPhoto.update({
    where: { id: photoId },
    data: { url: blob.url },
  });

  return NextResponse.json({ url: blob.url });
}
