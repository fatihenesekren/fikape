import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slugify";
import { findExistingVehicles, birebirAyniArac } from "@/lib/existingVehicle";
import { ekYilGecerli } from "@/lib/katalog/ek";
import { fotoUrlGecerli, temizMetin, yilCoz } from "@/lib/katalog/metin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID_CATEGORIES = ["otomobil", "motosiklet", "e-scooter", "e-bisiklet", "karavan", "kamyonet"];
const VALID_FUEL_TYPES  = ["GASOLINE", "DIESEL", "EV", "PHEV", "HYBRID", "LPG"];
const VALID_TRANSMISSIONS = ["Manuel", "Otomatik", "CVT", "Yarı Otomatik"];

// reviews route'undaki (src/app/api/reviews/route.ts) desenle aynı: kullanıcı
// bazlı, DB'den sayılan günlük limit — bu route daha önce hiç rate limitlenmemişti
// (bkz. güvenlik incelemesi, 2026-09-27).
const RATE_LIMIT_COUNT = 10;
const RATE_LIMIT_WINDOW_MS = 24 * 60 * 60 * 1000;

export async function POST(req: Request) {
  try {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Giriş gerekiyor" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Geçersiz istek" }, { status: 400 });
  }
  // Girdi temizliği: gizli/bidi karakterler, boşluk normalizasyonu, tip kontrolü (bkz. lib/katalog/metin.ts)
  if (body.trimName !== undefined && body.trimName !== null && typeof body.trimName !== "string") {
    return NextResponse.json({ error: "Geçersiz donanım adı" }, { status: 400 });
  }
  body.brandName = temizMetin(body.brandName) ?? body.brandName;
  body.modelName = temizMetin(body.modelName) ?? body.modelName;
  if (typeof body.trimName === "string") body.trimName = temizMetin(body.trimName) ?? "";
  if (typeof body.notes === "string") body.notes = (temizMetin(body.notes) ?? "").slice(0, 500);
  if (Array.isArray(body.photoUrls)) body.photoUrls = body.photoUrls.filter((u: unknown) => fotoUrlGecerli(u)).slice(0, 5);
  const yilSonuc = yilCoz(body.year);
  if (yilSonuc === "gecersiz" || (yilSonuc !== null && !ekYilGecerli(yilSonuc))) {
    return NextResponse.json({ error: "Geçerli bir model yılı giriniz (1900 – gelecek yıl)" }, { status: 400 });
  }
  body.year = yilSonuc;
  const { brandName, modelName, year, categorySlug, fuelType, transmission, trimName, notes, photoUrls, powerHp } = body;

  if (typeof brandName !== "string" || typeof modelName !== "string") {
    return NextResponse.json({ error: "Marka ve model zorunludur" }, { status: 400 });
  }
  if (!brandName?.trim() || !modelName?.trim()) {
    return NextResponse.json({ error: "Marka ve model zorunludur" }, { status: 400 });
  }
  if (String(brandName).trim().length > 80 || String(modelName).trim().length > 100 || (trimName && String(trimName).trim().length > 150)) {
    return NextResponse.json({ error: "Marka, model veya donanım adı çok uzun" }, { status: 400 });
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

  const recentCount = await prisma.vehicleSuggestion.count({
    where: { userId, createdAt: { gte: new Date(Date.now() - RATE_LIMIT_WINDOW_MS) } },
  });
  if (recentCount >= RATE_LIMIT_COUNT) {
    return NextResponse.json(
      { error: "Günlük araç önerisi limitine ulaştınız. 24 saat sonra tekrar deneyebilirsiniz." },
      { status: 429 },
    );
  }

  // Slug oluştur
  const baseParts = [brandName.trim(), modelName.trim(), trimName?.trim(), year]
    .filter(Boolean).join("-");
  const baseSlug = slugify(baseParts);
  // Alfasayısal karakter içermeyen ad (ör. yalnız noktalama/farklı alfabe) boş slug üretir ve farklı markaları aynı
  // kayda çökertir — reddet.
  if (!baseSlug || !slugify(brandName.trim()) || !slugify(modelName.trim())) {
    return NextResponse.json({ error: "Marka ve model en az bir harf veya rakam (a-z, 0-9) içermelidir" }, { status: 400 });
  }

  // Aktif katalogda var mı? — marka+model slug eşleşmesi (yıl/donanımdan
  // bağımsız, bkz. findExistingVehicles). Eski birebir-slug kontrolü
  // (marka-model-donanım-yıl) kullanıcı farklı yıl/donanım seçtiğinde tutmuyor,
  // sessizce PENDING kopya üretiyordu.
  const existingMatches = await findExistingVehicles(
    brandName.trim(), modelName.trim(), categorySlug,
  );

  // Gerçek kopya kontrolü — bkz. lib/existingVehicle.ts:birebirAyniArac
  const yeniAracBilgisi = {
    year: year ? Number(year) : null,
    trimName: trimName ?? null,
    fuelType: fuelType || null,
    transmission: transmission || null,
  };
  const blockingMatches = existingMatches.filter((mm) => birebirAyniArac(mm, yeniAracBilgisi, categorySlug));

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
  const txSlug = transmission ? slugify(transmission) : null;
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

  // Model.slug global tekil: aynı slug başka bir markaya aitse (ör. "BMW X"+"5" ↔ "BMW"+"X 5") yanlış markaya
  // bağlamak yerine reddet.
  if (model.brandId !== brand.id) {
    return NextResponse.json({ error: "Bu model adı başka bir markaya ait görünüyor; adı farklı yazmayı deneyin" }, { status: 409 });
  }

  const attributes: Record<string, string> = {};
  if (fuelType) attributes.fuel_type = fuelType;
  if (transmission) attributes.transmission = transmission;
  // Katalog versiyonundan ayrıştırılan beygir gücü (bkz. parseVersion) — admin
  // onayında Gemini tahmini yerine bu değer esas alınır.
  if (Number.isInteger(powerHp) && powerHp >= 40 && powerHp <= 2000) {
    attributes.power_hp = String(powerHp);
  }

  // Slug çakışma önlemi
  let finalSlug = slug;
  const existing = await prisma.product.findUnique({ where: { slug: finalSlug } });
  if (existing) finalSlug = `${slug}-${Date.now()}`;

  // PENDING ürün oluştur (isActive: false → public listelerden gizli).
  // Çift tıklama/eşzamanlı istek slug'ı bizden önce alabilir (TOCTOU) — unique
  // constraint çakışmasında (P2002) tekrar deneriz, opak 500 dönmeyiz.
  const productData = {
    name:       `${brandName.trim()} ${modelName.trim()}${trimName?.trim() ? ` ${trimName.trim()}` : ""}${year ? ` ${year}` : ""}`,
    year:       year ? Number(year) : null,
    trimName:   trimName?.trim() || null,
    attributes,
    categoryId: category.id,
    brandId:    brand.id,
    modelId:    model.id,
    status:     "PENDING" as const,
    isActive:   false,
  };
  let product;
  try {
    product = await prisma.product.create({ data: { slug: finalSlug, ...productData } });
  } catch (e) {
    if (e instanceof Error && "code" in e && e.code === "P2002") {
      product = await prisma.product.create({ data: { slug: `${finalSlug}-${Date.now()}`, ...productData } });
    } else {
      throw e;
    }
  }

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
