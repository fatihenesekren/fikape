import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID_CATEGORIES = ["otomobil", "motosiklet", "e-scooter", "e-bisiklet", "karavan", "kamyonet"];
const VALID_FUEL_TYPES  = ["GASOLINE", "DIESEL", "EV", "PHEV", "HYBRID", "LPG"];

function slugify(text: string): string {
  return String(text)
    .toLowerCase()
    .replace(/ğ/g, "g").replace(/ü/g, "u").replace(/ş/g, "s")
    .replace(/ı/g, "i").replace(/ö/g, "o").replace(/ç/g, "c")
    .normalize("NFD").replace(/\p{Mn}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function POST(req: Request) {
  try {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Giriş gerekiyor" }, { status: 401 });
  }

  const body = await req.json();
  const { brandName, modelName, year, categorySlug, fuelType, trimName, notes, photoUrls } = body;

  if (!brandName?.trim() || !modelName?.trim()) {
    return NextResponse.json({ error: "Marka ve model zorunludur" }, { status: 400 });
  }
  if (!VALID_CATEGORIES.includes(categorySlug)) {
    return NextResponse.json({ error: "Geçersiz kategori" }, { status: 400 });
  }
  if (fuelType && !VALID_FUEL_TYPES.includes(fuelType)) {
    return NextResponse.json({ error: "Geçersiz yakıt tipi" }, { status: 400 });
  }

  const userId = Number(session.user.id);

  // Slug oluştur
  const baseParts = [brandName.trim(), modelName.trim(), trimName?.trim(), year]
    .filter(Boolean).join("-");
  const baseSlug = slugify(baseParts);

  // Aktif katalogda var mı?
  const activeProduct = await prisma.product.findFirst({
    where: { slug: baseSlug, status: "ACTIVE" },
    select: { slug: true },
  });
  if (activeProduct) {
    return NextResponse.json(
      { error: "Bu araç zaten katalogda mevcut", existingSlug: activeProduct.slug },
      { status: 409 }
    );
  }

  // Aynı PENDING ürün var mı? (başka bir kullanıcı önermişse veya önceki hatalı submit)
  const pendingProduct = await prisma.product.findFirst({
    where: { slug: baseSlug, status: "PENDING" },
    select: { id: true, slug: true },
  });
  if (pendingProduct) {
    // Öneri kaydı yoksa oluştur (önceki submit'te product oluştu ama öneri kaydedilemediyse)
    const existing = await prisma.vehicleSuggestion.findFirst({
      where: { productId: pendingProduct.id, userId },
    });
    if (!existing) {
      await prisma.vehicleSuggestion.create({
        data: {
          userId,
          brandName: brandName.trim(),
          modelName: modelName.trim(),
          year:      year ? Number(year) : null,
          categorySlug,
          fuelType:  fuelType || null,
          trimName:  trimName?.trim() || null,
          notes:     notes?.trim() || null,
          photoUrls: Array.isArray(photoUrls) ? photoUrls.filter((u: unknown) => typeof u === "string").slice(0, 3) : [],
          productId: pendingProduct.id,
        },
      });
    }
    return NextResponse.json({ slug: pendingProduct.slug }, { status: 200 });
  }

  // Kategori bul
  const category = await prisma.category.findUnique({ where: { slug: categorySlug } });
  if (!category) {
    return NextResponse.json({ error: `Kategori bulunamadı: ${categorySlug}` }, { status: 422 });
  }

  // Brand & Model — upsert
  const brandSlug = slugify(brandName.trim());
  const modelSlug = slugify(`${brandName.trim()}-${modelName.trim()}`);

  const brand = await prisma.brand.upsert({
    where: { slug: brandSlug },
    update: {},
    create: { slug: brandSlug, name: brandName.trim() },
  });
  const model = await prisma.model.upsert({
    where: { slug: modelSlug },
    update: {},
    create: { slug: modelSlug, name: modelName.trim(), brandId: brand.id },
  });

  const attributes: Record<string, string> = {};
  if (fuelType) attributes.fuel_type = fuelType;

  // Slug çakışma önlemi
  let finalSlug = baseSlug;
  const existing = await prisma.product.findUnique({ where: { slug: finalSlug } });
  if (existing) finalSlug = `${baseSlug}-${Date.now()}`;

  // PENDING ürün oluştur (isActive: false → public listelerden gizli)
  const product = await prisma.product.create({
    data: {
      slug:       finalSlug,
      name:       `${brandName.trim()} ${modelName.trim()}${trimName?.trim() ? ` ${trimName.trim()}` : ""}${year ? ` ${year}` : ""}`,
      year:       year ? Number(year) : null,
      trimName:   trimName?.trim() || null,
      attributes,
      categoryId: category.id,
      brandId:    brand.id,
      modelId:    model.id,
      status:     "PENDING",
      isActive:   false,
    },
  });

  // VehicleSuggestion — audit trail
  await prisma.vehicleSuggestion.create({
    data: {
      userId,
      brandName: brandName.trim(),
      modelName: modelName.trim(),
      year:      year ? Number(year) : null,
      categorySlug,
      fuelType:  fuelType || null,
      trimName:  trimName?.trim() || null,
      notes:     notes?.trim() || null,
      photoUrls: Array.isArray(photoUrls) ? photoUrls.filter((u: unknown) => typeof u === "string").slice(0, 3) : [],
      productId: product.id,
    },
  });

  return NextResponse.json({ slug: product.slug }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/oneriler]", err);
    return NextResponse.json({ error: "Sunucu hatası oluştu, lütfen tekrar deneyin" }, { status: 500 });
  }
}
