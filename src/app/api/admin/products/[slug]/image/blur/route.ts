import { NextResponse } from "next/server";
import { adminOturumu } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";
import { put } from "@vercel/blob";
import { eskiUrunGorseliniSil } from "@/lib/urunGorselTemizlik";
import { revalidateTag } from "next/cache";
import { GORSEL_KAYNAK_ETIKETI } from "@/lib/cacheEtiketleri";

export const runtime = "nodejs";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const admin = await adminOturumu();
  if (!admin) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 403 });
  }

  const { slug } = await params;

  const product = await prisma.product.findUnique({
    where: { slug },
    select: { id: true, imageUrl: true },
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

  // Yeni dosya kayıtlıyken eskisi (önceki blur ya da bulanıksız asıl) yetim kalmasın
  await eskiUrunGorseliniSil(product.id, product.imageUrl, blob.url);
  revalidateTag(GORSEL_KAYNAK_ETIKETI, { expire: 0 }); // atıf listesindeki küçük önizleme yeni dosyayı göstersin

  return NextResponse.json({ url: blob.url });
}
