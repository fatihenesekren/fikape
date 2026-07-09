import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { calcOverall } from "@/lib/fikape";
import { calcTrustScore } from "@/lib/trustScore";
import { notifyGarageBrandFollowers } from "@/lib/notifications";
import { normalizeAttributeValues } from "@/lib/vehicleTypes";
import { findVerifiedVehicleImage } from "@/lib/wikidataImage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

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
  const { action, adminNote, customSlug, attributes: incomingAttrs, imageUrl: previewedImageUrl } = body as {
    action: "APPROVED" | "REJECTED";
    adminNote?: string;
    customSlug?: string;
    attributes?: Record<string, string>;
    imageUrl?: string | null;
  };

  if (action !== "APPROVED" && action !== "REJECTED") {
    return NextResponse.json({ error: "Geçersiz işlem" }, { status: 400 });
  }

  const suggestion = await prisma.vehicleSuggestion.findUnique({
    where: { id: suggestionId },
  });
  if (!suggestion) return NextResponse.json({ error: "Öneri bulunamadı" }, { status: 404 });
  if (suggestion.status !== "PENDING") {
    return NextResponse.json({ error: "Bu öneri zaten işleme alındı" }, { status: 409 });
  }

  // ── REDDETME ──
  if (action === "REJECTED") {
    if (suggestion.productId) {
      // Yeni akış: PENDING ürünü ve bağlı yorumları reddet
      await prisma.review.updateMany({
        where: { productId: suggestion.productId },
        data: { status: "REJECTED", rejectedAt: new Date(), rejectionReason: adminNote ?? "Araç önerisi reddedildi" },
      });
      await prisma.product.update({
        where: { id: suggestion.productId },
        data: { status: "REJECTED" },
      });
    }
    await prisma.vehicleSuggestion.update({
      where: { id: suggestionId },
      data: { status: "REJECTED", adminNote: adminNote ?? null, reviewedAt: new Date(), reviewedBy: Number(session.user.id) },
    });
    return NextResponse.json({ ok: true, action: "REJECTED" });
  }

  // ── ONAYLAMA ──

  // Yeni akış: PENDING ürün zaten oluşturulmuş
  if (suggestion.productId) {
    const existingProduct = await prisma.product.findUnique({
      where: { id: suggestion.productId },
      select: { attributes: true, imageUrl: true, photos: { where: { status: "APPROVED" }, take: 1 } },
    });
    const mergedAttrs: Record<string, unknown> = {
      ...(typeof existingProduct?.attributes === "object" && existingProduct.attributes !== null
        ? existingProduct.attributes as Record<string, unknown>
        : {}),
      ...normalizeAttributeValues(incomingAttrs ?? {}),
    };

    // Görsel: admin modalde önizlemesini gördüyse o değeri kullan (client
    // zaten doğrulanmış görseli fetch-specs'ten çekip göstermişti), yoksa
    // (ör. eski client) sunucu tarafında doğrulanmış yöntemle tekrar dene.
    const wikiImage = existingProduct?.imageUrl
      ? null
      : previewedImageUrl !== undefined
        ? previewedImageUrl
        : await findVerifiedVehicleImage(suggestion.brandName, suggestion.modelName, suggestion.year);

    // Kullanıcının önerdiği fotoğrafları ProductPhoto'ya ekle
    const suggestionPhotos: string[] = Array.isArray(suggestion.photoUrls) ? suggestion.photoUrls : [];
    if (suggestionPhotos.length > 0) {
      await prisma.productPhoto.createMany({
        data: suggestionPhotos.map((url, idx) => ({
          productId: suggestion.productId!,
          uploadedByUserId: suggestion.userId ?? null,
          url, status: "APPROVED" as const, order: idx,
        })),
        skipDuplicates: true,
      });
    }

    await prisma.product.update({
      where: { id: suggestion.productId },
      data: {
        status: "ACTIVE",
        isActive: true,
        attributes: mergedAttrs as Parameters<typeof prisma.product.update>[0]["data"]["attributes"],
        ...(wikiImage ? { imageUrl: wikiImage } : {}),
      },
    });
    // Bekleyen yorumları yayınla
    await prisma.review.updateMany({
      where: { productId: suggestion.productId, status: "PENDING" },
      data: { status: "PUBLISHED", publishedAt: new Date() },
    });
    await prisma.vehicleSuggestion.update({
      where: { id: suggestionId },
      data: { status: "APPROVED", adminNote: adminNote ?? null, reviewedAt: new Date(), reviewedBy: Number(session.user.id) },
    });
    await notifyGarageBrandFollowers(suggestion.productId);
    return NextResponse.json({ ok: true, action: "APPROVED", productId: suggestion.productId });
  }

  // Legacy akış: productId yok, eski yöntemle ürün oluştur
  const brandSlug = slugify(suggestion.brandName);
  const modelSlug = slugify(`${suggestion.brandName}-${suggestion.modelName}`);
  const productSlug =
    customSlug?.trim() ||
    slugify([suggestion.brandName, suggestion.modelName, suggestion.trimName, suggestion.year].filter(Boolean).join("-"));

  const category = await prisma.category.findUnique({ where: { slug: suggestion.categorySlug } });
  if (!category) {
    return NextResponse.json({ error: `Kategori bulunamadı: ${suggestion.categorySlug}` }, { status: 422 });
  }

  const existingProduct = await prisma.product.findUnique({ where: { slug: productSlug } });
  if (existingProduct) {
    return NextResponse.json(
      { error: `"${productSlug}" slug'ı zaten kullanımda. Özel bir slug belirtin.` },
      { status: 409 }
    );
  }

  const brand = await prisma.brand.upsert({
    where: { slug: brandSlug },
    update: {},
    create: { slug: brandSlug, name: suggestion.brandName },
  });
  const model = await prisma.model.upsert({
    where: { slug: modelSlug },
    update: {},
    create: { slug: modelSlug, name: suggestion.modelName, brandId: brand.id },
  });

  const imageUrl = previewedImageUrl !== undefined
    ? previewedImageUrl
    : await findVerifiedVehicleImage(suggestion.brandName, suggestion.modelName, suggestion.year);
  const attributes: Record<string, unknown> = {};
  if (suggestion.fuelType) attributes.fuel_type = suggestion.fuelType;
  Object.assign(attributes, normalizeAttributeValues(incomingAttrs ?? {}));

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
      status: "ACTIVE",
      isActive: true,
      imageUrl: imageUrl ?? null,
    },
  });

  // Legacy reviewData
  const reviewData = suggestion.reviewData as {
    scoreFiyat: number; scoreKalite: number; scorePerformans: number; summaryText: string;
  } | null;

  if (reviewData && suggestion.userId) {
    const fi = Number(reviewData.scoreFiyat) * 2;
    const ka = Number(reviewData.scoreKalite) * 2;
    const pe = Number(reviewData.scorePerformans) * 2;
    const reviewer = await prisma.user.findUnique({
      where: { id: suggestion.userId },
      select: { trustLevel: true },
    });
    // Ürün bu anda oluşturuluyor, dolayısıyla garaj bağlantısı henüz mümkün değil (garajLinked: false)
    const trustScore = calcTrustScore({ trustLevel: reviewer?.trustLevel ?? 1, garajLinked: false });
    await prisma.review.create({
      data: {
        userId: suggestion.userId, productId: product.id,
        scoreFiyat: fi, scoreKalite: ka, scorePerformans: pe,
        scoreOverall: calcOverall({ scoreFiyat: fi, scoreKalite: ka, scorePerformans: pe }),
        summaryText: String(reviewData.summaryText).slice(0, 500),
        status: "PUBLISHED", publishedAt: new Date(), trustScore,
      },
    });
  }

  const photoUrls: string[] = Array.isArray(suggestion.photoUrls) ? suggestion.photoUrls : [];
  if (photoUrls.length > 0) {
    await prisma.productPhoto.createMany({
      data: photoUrls.map((url, idx) => ({
        productId: product.id,
        uploadedByUserId: suggestion.userId ?? null,
        url, status: "APPROVED" as const, order: idx,
      })),
    });
  }

  await prisma.vehicleSuggestion.update({
    where: { id: suggestionId },
    data: { status: "APPROVED", adminNote: adminNote ?? null, reviewedAt: new Date(), reviewedBy: Number(session.user.id) },
  });

  await notifyGarageBrandFollowers(product.id);

  return NextResponse.json({ ok: true, action: "APPROVED", productId: product.id, slug: product.slug });
}

function slugify(text: string): string {
  return String(text).toLowerCase()
    .replace(/ğ/g, "g").replace(/ü/g, "u").replace(/ş/g, "s")
    .replace(/ı/g, "i").replace(/ö/g, "o").replace(/ç/g, "c")
    .normalize("NFD").replace(/\p{Mn}/gu, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}
