import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/admin/oneriler/[id]
// body: { action: "APPROVED" | "REJECTED", adminNote?: string }
// On APPROVED: optionally body.slug — admin can override the auto-generated slug
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }

  const adminUser = await prisma.user.findUnique({
    where: { id: Number(session.user.id) },
    select: { trustLevel: true },
  });
  if (!adminUser || adminUser.trustLevel < 5) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
  }

  const { id } = await params;
  const suggestionId = Number(id);
  const body = await req.json();
  const { action, adminNote, customSlug } = body as {
    action: "APPROVED" | "REJECTED";
    adminNote?: string;
    customSlug?: string;
  };

  if (action !== "APPROVED" && action !== "REJECTED") {
    return NextResponse.json({ error: "Geçersiz işlem" }, { status: 400 });
  }

  const suggestion = await prisma.vehicleSuggestion.findUnique({
    where: { id: suggestionId },
  });
  if (!suggestion) {
    return NextResponse.json({ error: "Öneri bulunamadı" }, { status: 404 });
  }
  if (suggestion.status !== "PENDING") {
    return NextResponse.json({ error: "Bu öneri zaten işleme alındı" }, { status: 409 });
  }

  if (action === "REJECTED") {
    await prisma.vehicleSuggestion.update({
      where: { id: suggestionId },
      data: {
        status: "REJECTED",
        adminNote: adminNote ?? null,
        reviewedAt: new Date(),
        reviewedBy: Number(session.user.id),
      },
    });
    return NextResponse.json({ ok: true, action: "REJECTED" });
  }

  // ── ONAYLAMA: Brand + Model + Product oluştur ──
  const brandSlug = slugify(suggestion.brandName);
  const modelSlug = slugify(`${suggestion.brandName}-${suggestion.modelName}`);
  const productSlug =
    customSlug?.trim() ||
    slugify(
      [
        suggestion.brandName,
        suggestion.modelName,
        suggestion.trimName,
        suggestion.year,
      ]
        .filter(Boolean)
        .join("-")
    );

  // Kategori bul
  const category = await prisma.category.findUnique({
    where: { slug: suggestion.categorySlug },
  });
  if (!category) {
    return NextResponse.json(
      { error: `Kategori bulunamadı: ${suggestion.categorySlug}` },
      { status: 422 }
    );
  }

  // Brand — upsert
  const brand = await prisma.brand.upsert({
    where: { slug: brandSlug },
    update: {},
    create: { slug: brandSlug, name: suggestion.brandName },
  });

  // Model — upsert
  const model = await prisma.model.upsert({
    where: { slug: modelSlug },
    update: {},
    create: { slug: modelSlug, name: suggestion.modelName, brandId: brand.id },
  });

  // Slug çakışması kontrolü
  const existingProduct = await prisma.product.findUnique({ where: { slug: productSlug } });
  if (existingProduct) {
    return NextResponse.json(
      { error: `"${productSlug}" slug'ı zaten kullanımda. Özel bir slug belirtin.` },
      { status: 409 }
    );
  }

  const attributes: Record<string, string> = {};
  if (suggestion.fuelType) attributes.fuel_type = suggestion.fuelType;

  const product = await prisma.product.create({
    data: {
      slug: productSlug,
      name: `${suggestion.brandName} ${suggestion.modelName}${suggestion.trimName ? ` ${suggestion.trimName}` : ""}`,
      year: suggestion.year ?? null,
      trimName: suggestion.trimName ?? null,
      attributes: attributes as Parameters<typeof prisma.product.create>[0]["data"]["attributes"],
      categoryId: category.id,
      brandId: brand.id,
      modelId: model.id,
      isActive: true,
    },
  });

  await prisma.vehicleSuggestion.update({
    where: { id: suggestionId },
    data: {
      status: "APPROVED",
      adminNote: adminNote ?? null,
      reviewedAt: new Date(),
      reviewedBy: Number(session.user.id),
    },
  });

  return NextResponse.json({ ok: true, action: "APPROVED", productId: product.id, slug: product.slug });
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/ğ/g, "g").replace(/ü/g, "u").replace(/ş/g, "s")
    .replace(/ı/g, "i").replace(/ö/g, "o").replace(/ç/g, "c")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
