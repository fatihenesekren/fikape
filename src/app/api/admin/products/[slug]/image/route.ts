import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { put } from "@vercel/blob";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await auth();
  if (!session || Number(session.user.trustLevel) < 5) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 403 });
  }

  const { slug } = await params;

  const product = await prisma.product.findUnique({
    where: { slug },
    select: { id: true },
  });
  if (!product) {
    return NextResponse.json({ error: "Araç bulunamadı." }, { status: 404 });
  }

  const formData = await req.formData();
  const file = formData.get("image") as File | null;

  if (!file || file.size === 0) {
    return NextResponse.json({ error: "Dosya gerekli." }, { status: 400 });
  }

  const allowed = ["image/jpeg", "image/png", "image/webp", "image/avif"];
  if (!allowed.includes(file.type)) {
    return NextResponse.json({ error: "JPG, PNG veya WebP yükleyin." }, { status: 400 });
  }

  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: "Dosya 5MB'dan küçük olmalı." }, { status: 400 });
  }

  const ext = file.name.split(".").pop() ?? "jpg";
  const blob = await put(`product-images/${slug}.${ext}`, file, {
    access: "public",
    addRandomSuffix: false,
  });

  await prisma.product.update({
    where: { id: product.id },
    data: { imageUrl: blob.url },
  });

  return NextResponse.json({ ok: true, imageUrl: blob.url });
}

// URL'den direkt güncelleme (paste workflow)
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await auth();
  if (!session || Number(session.user.trustLevel) < 5) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 403 });
  }

  const { slug } = await params;

  let body: { imageUrl?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek gövdesi." }, { status: 400 });
  }

  const { imageUrl } = body;

  if (!imageUrl || !imageUrl.startsWith("http")) {
    return NextResponse.json({ error: "Geçerli bir URL girin." }, { status: 400 });
  }

  try {
    await prisma.product.update({
      where: { slug },
      data: { imageUrl },
    });
  } catch {
    return NextResponse.json({ error: `Araç bulunamadı veya DB hatası: ${slug}` }, { status: 500 });
  }

  return NextResponse.json({ ok: true, imageUrl });
}
