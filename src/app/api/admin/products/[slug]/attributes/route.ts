import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { ARAC_HAVUZU_ETIKETI } from "@/lib/cacheEtiketleri";
import { adminOturumu } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";
import { mergeAttributes } from "@/lib/mergeAttributes";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const admin = await adminOturumu();
    if (!admin) {
      return NextResponse.json({ error: "Yetkisiz." }, { status: 403 });
    }

    const { slug } = await params;

    let body: { attributes?: Record<string, string | null> };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Geçersiz istek gövdesi." }, { status: 400 });
    }

    const product = await prisma.product.findUnique({
      where: { slug },
      select: { attributes: true },
    });
    if (!product) {
      return NextResponse.json({ error: "Araç bulunamadı." }, { status: 404 });
    }

    const existing = (typeof product.attributes === "object" && product.attributes !== null
      ? product.attributes as Record<string, unknown>
      : {});
    // null / "" gelen anahtarlar silinir (bkz. mergeAttributes).
    const merged = mergeAttributes(existing, body.attributes ?? {});

    await prisma.product.update({
      where: { slug },
      data: { attributes: merged as Parameters<typeof prisma.product.update>[0]["data"]["attributes"] },
    });

    revalidateTag(ARAC_HAVUZU_ETIKETI, { expire: 0 }); // /araclar filtre/sayılar yeni özelliği görsün
    return NextResponse.json({ ok: true, attributes: merged });
  } catch (e) {
    console.error("[admin-product]", e);
    return NextResponse.json({ error: "İşlem tamamlanamadı. Lütfen tekrar deneyin." }, { status: 500 });
  }
}
