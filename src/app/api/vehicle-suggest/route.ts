import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { calcOverall } from "@/lib/fikape";
import { validateSummary, validateDetail } from "@/lib/reviewValidation";
import { vehicleSuggestSchema, formatZodError } from "@/lib/schemas";

function slugify(text: string): string {
  return String(text).toLowerCase()
    .replace(/ğ/g, "g").replace(/ü/g, "u").replace(/ş/g, "s")
    .replace(/ı/g, "i").replace(/ö/g, "o").replace(/ç/g, "c")
    .normalize("NFD").replace(/\p{Mn}/gu, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Giriş gerekli." }, { status: 401 });

  const userId = Number(session.user.id);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { emailVerifiedAt: true },
  });
  if (!user?.emailVerifiedAt) {
    return NextResponse.json(
      { error: "Yorum yazmak için e-posta adresinizi doğrulamanız gerekiyor." },
      { status: 403 }
    );
  }

  const parsed = vehicleSuggestSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 });
  }
  const {
    brandName, modelName, year, trimName, fuelType, categorySlug,
    scoreFiyat, scoreKalite, scorePerformans,
    summaryText, detailText, wouldBuyAgain, ownershipMonths, extendedData,
  } = parsed.data;

  const summaryCheck = validateSummary(summaryText ?? "");
  if (!summaryCheck.ok) return NextResponse.json({ error: summaryCheck.error }, { status: 400 });
  const detailCheck = validateDetail(detailText ?? "");
  if (!detailCheck.ok) return NextResponse.json({ error: detailCheck.error }, { status: 400 });

  const category = await prisma.category.findUnique({ where: { slug: categorySlug } });
  if (!category) return NextResponse.json({ error: "Kategori bulunamadı." }, { status: 422 });

  const brandSlug = slugify(brandName.trim());
  const modelSlug = slugify(`${brandName.trim()}-${modelName.trim()}`);
  const baseParts = [brandName.trim(), modelName.trim(), trimName?.trim(), year].filter(Boolean).join("-");
  const baseSlug  = slugify(baseParts);

  const activeProduct = await prisma.product.findFirst({
    where: { slug: baseSlug, status: "ACTIVE" },
    select: { slug: true },
  });
  if (activeProduct) {
    return NextResponse.json(
      { error: "Bu araç zaten katalogda mevcut.", existingSlug: activeProduct.slug },
      { status: 409 }
    );
  }

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

  let finalSlug = baseSlug;
  const slugConflict = await prisma.product.findUnique({ where: { slug: finalSlug } });
  if (slugConflict) finalSlug = `${baseSlug}-${Date.now()}`;

  const scoreOverall = calcOverall({ scoreFiyat, scoreKalite, scorePerformans });

  const product = await prisma.$transaction(async (tx) => {
    const product = await tx.product.create({
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

    await tx.vehicleSuggestion.create({
      data: {
        userId,
        brandName:    brandName.trim(),
        modelName:    modelName.trim(),
        year:         year ? Number(year) : null,
        categorySlug,
        fuelType:     fuelType || null,
        trimName:     trimName?.trim() || null,
        productId:    product.id,
      },
    });

    await tx.review.create({
      data: {
        userId,
        productId:               product.id,
        scoreFiyat,
        scoreKalite,
        scorePerformans,
        scoreOverall,
        summaryText:             summaryText.trim(),
        detailText:              detailText?.trim() || null,
        wouldBuyAgain:           wouldBuyAgain ?? null,
        ownershipMonthsAtReview: ownershipMonths ? Number(ownershipMonths) : null,
        extendedData:            (extendedData && Object.keys(extendedData).length
                                    ? extendedData
                                    : undefined) as Parameters<typeof tx.review.create>[0]["data"]["extendedData"],
        status:                  "PENDING",
      },
    });

    return product;
  });

  return NextResponse.json({ ok: true, productSlug: product.slug }, { status: 201 });
}
