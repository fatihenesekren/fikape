import { NextResponse } from "next/server";
import { pozitifTamsayiId } from "@/lib/validateId";
import { adminOturumu } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";
import { calcOverall } from "@/lib/fikape";
import { calcTrustScore } from "@/lib/trustScore";
import { notifyGarageBrandFollowers } from "@/lib/notifications";
import { normalizeAttributeValues } from "@/lib/vehicleTypes";
import { findVerifiedVehicleImage } from "@/lib/wikidataImage";
import { syncAiVehicleSummary } from "@/lib/ai/vehicleSummary";
import { revalidateTag } from "next/cache";
import { EK_ETIKET } from "@/lib/katalog/ekSunucu";
import { ekYilGecerli } from "@/lib/katalog/ek";
import { findExistingVehicles, birebirAyniArac } from "@/lib/existingVehicle";
import { fotoUrlGecerli, temizMetin, yilCoz } from "@/lib/katalog/metin";

const GECERLI_YAKIT = ["GASOLINE", "DIESEL", "EV", "PHEV", "HYBRID", "LPG"];
const GECERLI_VITES = ["Manuel", "Otomatik", "CVT", "Yarı Otomatik"];

/** Moderatörün onay öncesi yaptığı düzeltme (yazım, harf, versiyon/paket ayrımı). */
type Duzeltme = {
  brandName?: string; modelName?: string; trimName?: string | null;
  year?: number | null; fuelType?: string | null; transmission?: string | null;
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await adminOturumu();
  if (!admin) return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });

  const { id } = await params;
  const suggestionId = pozitifTamsayiId(id);
  if (suggestionId === null) return NextResponse.json({ error: "Geçersiz kimlik." }, { status: 400 });
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") return NextResponse.json({ error: "Geçersiz istek" }, { status: 400 });
  const { action, adminNote, customSlug, attributes: incomingAttrs, imageUrl: previewedImageUrl, specConfidence, duzeltme } = body as {
    duzeltme?: Duzeltme;
    action: "APPROVED" | "REJECTED";
    adminNote?: string;
    customSlug?: string;
    attributes?: Record<string, string>;
    imageUrl?: string | null;
    specConfidence?: Record<string, unknown>;
  };

  if (action !== "APPROVED" && action !== "REJECTED") {
    return NextResponse.json({ error: "Geçersiz işlem" }, { status: 400 });
  }

  let suggestion = await prisma.vehicleSuggestion.findUnique({
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
      data: { status: "REJECTED", adminNote: adminNote ?? null, reviewedAt: new Date(), reviewedBy: admin.userId },
    });
    return NextResponse.json({ ok: true, action: "REJECTED" });
  }

  // ── ONAYLAMA ──

  // Moderatör düzeltmesi: marka/model/donanım/yıl/yakıt/vites onaydan ÖNCE düzeltilebilir. Kalıcı kayıt (ve canlı
  // katalog) düzeltilmiş değerlerle oluşur; slug değişmez (kullanıcının yorum linki bozulmasın).
  if (duzeltme && typeof duzeltme === "object") {
    const temiz = (v: unknown, max: number) => (typeof v === "string" ? (temizMetin(v) ?? "").slice(0, max + 1) : undefined);
    const brandName = temiz(duzeltme.brandName, 80) ?? suggestion.brandName;
    const modelName = temiz(duzeltme.modelName, 100) ?? suggestion.modelName;
    const trimRaw = duzeltme.trimName === undefined ? suggestion.trimName : temiz(duzeltme.trimName ?? "", 150) || null;
    const yilSonuc = duzeltme.year === undefined ? suggestion.year : yilCoz(duzeltme.year);
    if (yilSonuc === "gecersiz") return NextResponse.json({ error: "Geçersiz model yılı" }, { status: 422 });
    const year: number | null = yilSonuc;
    const fuelType = duzeltme.fuelType === undefined ? suggestion.fuelType : duzeltme.fuelType || null;
    const transmission = duzeltme.transmission === undefined ? suggestion.transmission : duzeltme.transmission || null;
    if (!brandName || !modelName || brandName.length > 80 || modelName.length > 100 || (trimRaw && trimRaw.length > 150)) {
      return NextResponse.json({ error: "Marka/model/donanım boş ya da çok uzun" }, { status: 422 });
    }
    if (year !== null && year !== undefined && !ekYilGecerli(Number(year))) {
      return NextResponse.json({ error: "Geçersiz model yılı" }, { status: 422 });
    }
    if (fuelType && !GECERLI_YAKIT.includes(fuelType)) return NextResponse.json({ error: "Geçersiz yakıt tipi" }, { status: 422 });
    if (transmission && !GECERLI_VITES.includes(transmission)) return NextResponse.json({ error: "Geçersiz vites tipi" }, { status: 422 });

    const degisti =
      brandName !== suggestion.brandName || modelName !== suggestion.modelName || (trimRaw ?? null) !== (suggestion.trimName ?? null) ||
      (year ?? null) !== (suggestion.year ?? null) || (fuelType ?? null) !== (suggestion.fuelType ?? null) || (transmission ?? null) !== (suggestion.transmission ?? null);

    if (degisti) {
      // Düzeltilmiş bilgi başka bir aktif kayıtla BİREBİR aynıysa onaylama (kopya olur)
      const benzerler = await findExistingVehicles(brandName, modelName, suggestion.categorySlug);
      const kendiSlug = suggestion.productId
        ? (await prisma.product.findUnique({ where: { id: suggestion.productId }, select: { slug: true } }))?.slug
        : undefined;
      const kopya = benzerler.find((mm) =>
        mm.slug !== kendiSlug &&
        birebirAyniArac(mm, { year: year ?? null, trimName: trimRaw ?? null, fuelType: fuelType ?? null, transmission: transmission ?? null }));
      if (kopya) {
        return NextResponse.json({ error: `Düzeltilen bilgilerle aynı araç zaten kayıtlı: ${kopya.name} (/araclar/${kopya.slug})` }, { status: 409 });
      }
      const brandSlug = slugify(brandName);
      const modelSlug = slugify(`${brandName}-${modelName}`);
      if (!brandSlug || !modelSlug) return NextResponse.json({ error: "Marka/model alfasayısal karakter içermiyor" }, { status: 422 });
      // Paylaşılan marka/model kaydının adı burada örtük olarak DEĞİŞTİRİLMEZ (tüm araçları etkilerdi); yeniden adlandırma
      // Katalog Yönetimi > Marka / Model ekranından, denetim kaydıyla yapılır. Ürün adı kayıtlı (kanonik) adlarla kurulur.
      const brand = await prisma.brand.upsert({ where: { slug: brandSlug }, update: {}, create: { slug: brandSlug, name: brandName } });
      const model = await prisma.model.upsert({ where: { slug: modelSlug }, update: {}, create: { slug: modelSlug, name: modelName, brandId: brand.id } });
      if (model.brandId !== brand.id) {
        return NextResponse.json({ error: "Bu model adı başka bir markaya ait görünüyor (slug çakışması); adı farklı yazın" }, { status: 409 });
      }
      const oneriId = suggestion.productId;
      const sonOneri = await prisma.$transaction(async (tx) => {
      if (oneriId) {
        const urun = await tx.product.findUnique({ where: { id: oneriId }, select: { attributes: true } });
        const a = { ...((urun?.attributes && typeof urun.attributes === "object" ? urun.attributes : {}) as Record<string, unknown>) };
        if (fuelType) a.fuel_type = fuelType; else delete a.fuel_type;
        if (transmission) a.transmission = transmission; else delete a.transmission;
        await tx.product.update({
          where: { id: oneriId },
          data: {
            brandId: brand.id, modelId: model.id,
            name: `${brand.name} ${model.name}${trimRaw ? ` ${trimRaw}` : ""}${year ? ` ${year}` : ""}`,
            year: year ?? null, trimName: trimRaw ?? null,
            attributes: a as Parameters<typeof prisma.product.update>[0]["data"]["attributes"],
          },
        });
      }
      return tx.vehicleSuggestion.update({
        where: { id: suggestionId },
        data: { brandName, modelName, trimName: trimRaw ?? null, year: year ?? null, fuelType: fuelType ?? null, transmission: transmission ?? null },
      });
      });
      suggestion = sonOneri;
    }
  }

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

    // Kullanıcının önerdiği fotoğraflar (yalnız güvenli https/Blob adresleri)
    const suggestionPhotos: string[] = (Array.isArray(suggestion.photoUrls) ? suggestion.photoUrls : []).filter((u) => fotoUrlGecerli(u));
    const productId = suggestion.productId;

    // Tüm durum değişiklikleri TEK işlemde ve atomik "talep" ile: aynı anda iki onay (çift tıklama/iki admin) ya da
    // yarıda kalan bir hata ürünü/öneriyi tutarsız bırakmaz.
    const talepEdildi = await prisma.$transaction(async (tx) => {
      const talep = await tx.vehicleSuggestion.updateMany({
        where: { id: suggestionId, status: "PENDING" },
        data: {
          status: "APPROVED", adminNote: adminNote ?? null,
          reviewedAt: new Date(), reviewedBy: admin.userId,
          specConfidence: (specConfidence ?? undefined) as Parameters<typeof prisma.vehicleSuggestion.update>[0]["data"]["specConfidence"],
        },
      });
      if (talep.count === 0) return false;
      if (suggestionPhotos.length > 0) {
        await tx.productPhoto.createMany({
          data: suggestionPhotos.map((url, idx) => ({
            productId, uploadedByUserId: suggestion.userId ?? null,
            url, status: "APPROVED" as const, order: idx,
          })),
          skipDuplicates: true,
        });
      }
      await tx.product.update({
        where: { id: productId },
        data: {
          status: "ACTIVE",
          isActive: true,
          attributes: mergedAttrs as Parameters<typeof prisma.product.update>[0]["data"]["attributes"],
          ...(wikiImage ? { imageUrl: wikiImage } : {}),
        },
      });
      // Bekleyen yorumları yayınla
      await tx.review.updateMany({
        where: { productId, status: "PENDING" },
        data: { status: "PUBLISHED", publishedAt: new Date() },
      });
      return true;
    });
    if (!talepEdildi) {
      return NextResponse.json({ error: "Bu öneri zaten işleme alındı" }, { status: 409 });
    }

    // Araç artık ACTIVE: canlı katalog önbelleğini HEMEN geçersiz kıl (bildirim/AI özeti hata verse de forma düşsün)
    revalidateTag(EK_ETIKET, { expire: 0 });
    try { await notifyGarageBrandFollowers(productId); } catch (e) { console.error("[notifyGarageBrandFollowers]", e); }
    await syncAiVehicleSummary(productId).catch((e) => console.error("[ai-vehicle-summary]", e));
    return NextResponse.json({ ok: true, action: "APPROVED", productId });
  }

  // Legacy akış: productId yok, eski yöntemle ürün oluştur
  const brandSlug = slugify(suggestion.brandName);
  const modelSlug = slugify(`${suggestion.brandName}-${suggestion.modelName}`);
  const productSlug = customSlug?.trim()
    ? slugify(customSlug)
    : slugify([suggestion.brandName, suggestion.modelName, suggestion.trimName, suggestion.year].filter(Boolean).join("-"));

  if (!productSlug) {
    return NextResponse.json({ error: "Geçersiz slug: alfasayısal karakter içermiyor." }, { status: 422 });
  }

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
    data: {
      status: "APPROVED", adminNote: adminNote ?? null,
      reviewedAt: new Date(), reviewedBy: admin.userId,
      specConfidence: (specConfidence ?? undefined) as Parameters<typeof prisma.vehicleSuggestion.update>[0]["data"]["specConfidence"],
    },
  });

  await notifyGarageBrandFollowers(product.id);
  await syncAiVehicleSummary(product.id).catch((e) => console.error("[ai-vehicle-summary]", e));

  revalidateTag(EK_ETIKET, { expire: 0 });
  return NextResponse.json({ ok: true, action: "APPROVED", productId: product.id, slug: product.slug });
}

function slugify(text: string): string {
  return String(text).toLowerCase()
    .replace(/ğ/g, "g").replace(/ü/g, "u").replace(/ş/g, "s")
    .replace(/ı/g, "i").replace(/ö/g, "o").replace(/ç/g, "c")
    .normalize("NFD").replace(/\p{Mn}/gu, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}
