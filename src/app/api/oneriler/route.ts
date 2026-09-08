import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slugify";
import { findExistingVehicles } from "@/lib/existingVehicle";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID_CATEGORIES = ["otomobil", "motosiklet", "e-scooter", "e-bisiklet", "karavan", "kamyonet"];
const VALID_FUEL_TYPES  = ["GASOLINE", "DIESEL", "EV", "PHEV", "HYBRID", "LPG"];
const VALID_TRANSMISSIONS = ["Manuel", "Otomatik", "CVT", "Yarı Otomatik"];

export async function POST(req: Request) {
  try {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Giriş gerekiyor" }, { status: 401 });
  }

  const body = await req.json();
  const { brandName, modelName, year, categorySlug, fuelType, transmission, trimName, notes, photoUrls } = body;

  if (!brandName?.trim() || !modelName?.trim()) {
    return NextResponse.json({ error: "Marka ve model zorunludur" }, { status: 400 });
  }
  if (!VALID_CATEGORIES.includes(categorySlug)) {
    return NextResponse.json({ error: "Geçersiz kategori" }, { status: 400 });
  }
  if (fuelType && !VALID_FUEL_TYPES.includes(fuelType)) {
    return NextResponse.json({ error: "Geçersiz yakıt tipi" }, { status: 400 });
  }
  if (transmission && !VALID_TRANSMISSIONS.includes(transmission)) {
    return NextResponse.json({ error: "Geçersiz vites tipi" }, { status: 400 });
  }

  const userId = Number(session.user.id);

  // Slug oluştur
  const baseParts = [brandName.trim(), modelName.trim(), trimName?.trim(), year]
    .filter(Boolean).join("-");
  const baseSlug = slugify(baseParts);

  // Aktif katalogda var mı? — marka+model slug eşleşmesi (yıl/donanımdan
  // bağımsız, bkz. findExistingVehicles). Eski birebir-slug kontrolü
  // (marka-model-donanım-yıl) kullanıcı farklı yıl/donanım seçtiğinde tutmuyor,
  // sessizce PENDING kopya üretiyordu.
  const existingMatches = await findExistingVehicles(
    brandName.trim(), modelName.trim(), categorySlug,
  );

  // Vites-varyantı istisnası: kullanıcı bir vites belirttiyse ve mevcut
  // eşleşmelerin HİÇBİRİ aynı vitese sahip değilse (ör. katalogda yalnızca
  // Otomatik var, öneri Manuel), ayrı bir varyant olarak eklenmesine izin ver.
  const txSlug = transmission ? slugify(transmission) : null;
  const blockingMatches = existingMatches.filter(
    (mm) => !txSlug || !mm.transmission || slugify(mm.transmission) === txSlug,
  );

  if (blockingMatches.length > 0) {
    const top = blockingMatches[0];
    return NextResponse.json(
      {
        error: "Bu araç zaten katalogda mevcut",
        existingSlug:  top.slug,
        existingName:  top.name,
        reviewCount:   top.reviewCount,
        matches:       blockingMatches,
      },
      { status: 409 }
    );
  }

  const isDifferentVariant = existingMatches.length > 0;
  const slug = isDifferentVariant && txSlug ? `${baseSlug}-${txSlug}` : baseSlug;

  // Aynı PENDING ürün var mı? (başka bir kullanıcı önermişse veya önceki hatalı submit)
  const pendingProduct = await prisma.product.findFirst({
    where: { slug, status: "PENDING" },
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
          transmission: transmission || null,
          trimName:  trimName?.trim() || null,
          notes:     notes?.trim() || null,
          photoUrls: Array.isArray(photoUrls) ? photoUrls.filter((u: unknown) => typeof u === "string").slice(0, 5) : [],
          productId: pendingProduct.id,
        },
      });
    }
    return NextResponse.json({ slug: pendingProduct.slug }, { status: 200 });
  }

  // Aynı REJECTED ürün var mı? — geri dönüştür: timestamp'li kopya slug üretmek
  // yerine mevcut kaydı PENDING'e çevirip yeni öneriye bağla (temiz slug korunur,
  // reddedilen çöp kayıt birikmez; eski REJECTED yorumlar olduğu gibi kalır)
  const rejectedProduct = await prisma.product.findFirst({
    where: { slug, status: "REJECTED" },
    select: { id: true, slug: true },
  });
  if (rejectedProduct) {
    await prisma.product.update({
      where: { id: rejectedProduct.id },
      data: { status: "PENDING", isActive: false },
    });
    await prisma.vehicleSuggestion.create({
      data: {
        userId,
        brandName: brandName.trim(),
        modelName: modelName.trim(),
        year:      year ? Number(year) : null,
        categorySlug,
        fuelType:  fuelType || null,
        transmission: transmission || null,
        trimName:  trimName?.trim() || null,
        notes:     notes?.trim() || null,
        photoUrls: Array.isArray(photoUrls) ? photoUrls.filter((u: unknown) => typeof u === "string").slice(0, 5) : [],
        productId: rejectedProduct.id,
      },
    });
    return NextResponse.json({ slug: rejectedProduct.slug }, { status: 200 });
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
  if (transmission) attributes.transmission = transmission;

  // Slug çakışma önlemi
  let finalSlug = slug;
  const existing = await prisma.product.findUnique({ where: { slug: finalSlug } });
  if (existing) finalSlug = `${slug}-${Date.now()}`;

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
      transmission: transmission || null,
      trimName:  trimName?.trim() || null,
      notes:     notes?.trim() || null,
      photoUrls: Array.isArray(photoUrls) ? photoUrls.filter((u: unknown) => typeof u === "string").slice(0, 5) : [],
      productId: product.id,
    },
  });

  return NextResponse.json({ slug: product.slug }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/oneriler]", err);
    return NextResponse.json({ error: "Sunucu hatası oluştu, lütfen tekrar deneyin" }, { status: 500 });
  }
}
