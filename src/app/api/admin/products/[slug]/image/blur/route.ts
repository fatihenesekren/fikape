import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { put } from "@vercel/blob";

export const runtime = "nodejs";

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
  const file = formData.get("file") as File | null;
  if (!file) {
    return NextResponse.json({ error: "Dosya gerekli." }, { status: 400 });
  }

  const blob = await put(`product-images/${slug}-blurred-${Date.now()}.jpg`, file, {
    access: "public",
  });

  await prisma.product.update({
    where: { id: product.id },
    data: { imageUrl: blob.url },
  });

  return NextResponse.json({ url: blob.url });
}
