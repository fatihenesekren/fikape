import { NextResponse } from "next/server";
import { adminOturumu } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";
import { normalizeAttributeValues } from "@/lib/vehicleTypes";

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

    let body: { attributes?: Record<string, string> };
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
    const merged = { ...existing, ...normalizeAttributeValues(body.attributes ?? {}) };

    await prisma.product.update({
      where: { slug },
      data: { attributes: merged as Parameters<typeof prisma.product.update>[0]["data"]["attributes"] },
    });

    return NextResponse.json({ ok: true, attributes: merged });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
