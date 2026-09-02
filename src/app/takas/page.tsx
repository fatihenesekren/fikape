import type { Metadata } from "next";
import Link from "next/link";
import { Prisma } from "@/generated/prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { TURKISH_CITIES } from "@/lib/turkishCities";
import { TradeCard } from "./TradeCard";
import { TakasFilterForm } from "./TakasFilterForm";
import { SavedSearchPanel } from "./SavedSearchPanel";
import { matchesWant, fuelTransmissionFromAttributes, type WantCriteria, type VehicleFacts } from "@/lib/tradeMatching";
import type { LocationScope, TradeFuelType } from "@/lib/tradeExpectations";
import type { DamageStatus } from "@/lib/damageStatus";

const PAGE_SIZE = 20;

// Serbest metin aramada aksan-duyarsızlık — ana site aramasındaki (/arama)
// normalize() ile aynı mantık (bkz. kullanıcı onayı: "ana site aramasıyla
// aynı aksan-duyarsızlık olsun"). Burada tek fark: DB seviyesinde değil,
// diğer filtrelerle ÖNCE daraltılmış (ve sınırlı sayıdaki) küme üzerinde
// JS'te uygulanıyor — envanter büyüdükçe tüm ilanları çekip filtrelemenin
// tekrar "Kritik" ölçeklenebilirlik hatasına dönmemesi için (bkz. denetim
// raporu).
const DIACRITIC_MARKS_RE = new RegExp("[\\u0300-\\u036f]", "g");
function normalize(str: string) {
  return str
    .toLowerCase()
    .replace(/ı/g, "i")
    .normalize("NFD")
    .replace(DIACRITIC_MARKS_RE, "");
}

interface TakasSearchParams {
  il?: string; kategori?: string; marka?: string; odeme?: string; sayfa?: string;
  yilMin?: string; yilMax?: string; kmMin?: string; kmMax?: string;
  yakit?: string; vites?: string; q?: string;
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<TakasSearchParams>;
}): Promise<Metadata> {
  const params = await searchParams;
  const isFiltered = Object.values(params).some(Boolean);
  return {
    title: "Araç Takas İlanları – fikape",
    robots: isFiltered ? { index: false, follow: true } : undefined,
    alternates: { canonical: "/takas" },
  };
}

export default async function TakasPage({
  searchParams,
}: {
  searchParams: Promise<TakasSearchParams>;
}) {
  const params = await searchParams;
  const il = params.il ?? "";
  const page = Math.max(1, parseInt(params.sayfa ?? "1") || 1);
  const yilMin = params.yilMin ? parseInt(params.yilMin) : undefined;
  const yilMax = params.yilMax ? parseInt(params.yilMax) : undefined;
  const kmMin = params.kmMin ? parseInt(params.kmMin) : undefined;
  const kmMax = params.kmMax ? parseInt(params.kmMax) : undefined;
  const yakit = params.yakit ?? "";
  const vites = params.vites ?? "";
  const q = (params.q ?? "").trim();

  // İl seçilmemişse artık tüm Türkiye'deki ilanlar gösteriliyor (önceden boş sayfa gösterip
  // platformun envanterini hiç göstermiyordu — bkz. denetim raporu).
  const { listings, total } = await fetchListings(
    il, params.kategori, params.marka, params.odeme, yilMin, yilMax, kmMin, kmMax, yakit, vites, q, page
  );
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // Mevcut filtreleri koruyarak sayfa linki üretir (pagination kontrolleri için).
  function pageHref(targetPage: number) {
    const qs = new URLSearchParams();
    if (il) qs.set("il", il);
    if (params.kategori) qs.set("kategori", params.kategori);
    if (params.marka) qs.set("marka", params.marka);
    if (params.odeme) qs.set("odeme", params.odeme);
    if (params.yilMin) qs.set("yilMin", params.yilMin);
    if (params.yilMax) qs.set("yilMax", params.yilMax);
    if (params.kmMin) qs.set("kmMin", params.kmMin);
    if (params.kmMax) qs.set("kmMax", params.kmMax);
    if (params.yakit) qs.set("yakit", params.yakit);
    if (params.vites) qs.set("vites", params.vites);
    if (params.q) qs.set("q", params.q);
    if (targetPage > 1) qs.set("sayfa", String(targetPage));
    const q = qs.toString();
    return q ? `/takas?${q}` : "/takas";
  }

  const categories = await prisma.category.findMany({
    where: { isActive: true, parentId: { not: null } },
    select: { id: true, slug: true, name: true },
    orderBy: { sortOrder: "asc" },
  }).catch(() => []);
  const brands = await prisma.brand.findMany({
    where: { isActive: true },
    select: { id: true, slug: true, name: true },
    orderBy: { name: "asc" },
  }).catch(() => []);
  const categoryBrandLinks = await prisma.product.findMany({
    where: { isActive: true },
    select: { category: { select: { slug: true } }, brand: { select: { slug: true } } },
    distinct: ["categoryId", "brandId"],
  }).catch(() => []);
  const categoryBrandMap: Record<string, string[]> = {};
  for (const link of categoryBrandLinks) {
    (categoryBrandMap[link.category.slug] ??= []).push(link.brand.slug);
  }

  const session = await auth();
  const isLoggedIn = !!session?.user?.id;

  // "Sana Uygun" rozeti — kullanıcının kendi aktif ilanı varsa, listedeki her
  // adayın hem aracı kullanıcının aradığına hem kullanıcının aracı adayın
  // aradığına uyup uymadığı kontrol edilir (bkz. boşluk raporu, DÜŞÜK madde
  // — Faz 1). Mevcut alanlar üzerinden hesaplanıyor, yeni veri toplanmadı.
  const myListing = isLoggedIn
    ? await prisma.tradeListing.findFirst({
        where: { userId: Number(session!.user.id), isActive: true },
        select: {
          city: true,
          damageStatus: true,
          wantCategoryId: true,
          wantBrandId: true,
          wantLocationScope: true,
          wantDamageStatuses: true,
          wantYearMin: true, wantYearMax: true, wantKmMin: true, wantKmMax: true,
          wantFuelTypes: true, wantTransmissions: true,
          product: { select: { categoryId: true, brandId: true, year: true, attributes: true } },
          userProduct: { select: { usageAmount: true, usageUnit: true } },
        },
      }).catch(() => null)
    : null;
  const myWant: WantCriteria | null = myListing
    ? {
        wantCategoryId: myListing.wantCategoryId,
        wantBrandId: myListing.wantBrandId,
        wantLocationScope: myListing.wantLocationScope as LocationScope,
        wantDamageStatuses: myListing.wantDamageStatuses as DamageStatus[],
        city: myListing.city,
        wantYearMin: myListing.wantYearMin,
        wantYearMax: myListing.wantYearMax,
        wantKmMin: myListing.wantKmMin,
        wantKmMax: myListing.wantKmMax,
        wantFuelTypes: myListing.wantFuelTypes as TradeFuelType[],
        wantTransmissions: myListing.wantTransmissions,
      }
    : null;
  const myVehicle: VehicleFacts | null = myListing
    ? {
        categoryId: myListing.product.categoryId,
        brandId: myListing.product.brandId,
        city: myListing.city,
        damageStatus: myListing.damageStatus,
        year: myListing.product.year,
        km: myListing.userProduct?.usageUnit === "km" ? myListing.userProduct.usageAmount : null,
        ...fuelTransmissionFromAttributes(myListing.product.attributes),
      }
    : null;

  const selectedCategory = categories.find((c) => c.slug === (params.kategori ?? ""));
  const selectedBrand = brands.find((b) => b.slug === (params.marka ?? ""));
  const savedSearches = isLoggedIn
    ? await prisma.savedSearch.findMany({
        where: { userId: Number(session!.user.id) },
        include: { category: { select: { name: true } }, brand: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
      }).catch(() => [])
    : [];

  return (
    <div className="max-w-3xl w-full mx-auto px-4 py-10">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-gray-900">Araç Takas İlanları</h1>
        <p className="text-sm text-gray-500 mt-1">Aracını takasa açan kullanıcıları keşfet.</p>
      </div>

      <TakasFilterForm
        il={il}
        kategoriSlug={params.kategori ?? ""}
        markaSlug={params.marka ?? ""}
        odemeNiyeti={params.odeme ?? ""}
        yilMin={params.yilMin ?? ""}
        yilMax={params.yilMax ?? ""}
        kmMin={params.kmMin ?? ""}
        kmMax={params.kmMax ?? ""}
        yakit={yakit}
        vites={vites}
        q={q}
        cities={TURKISH_CITIES}
        categories={categories}
        brands={brands}
        categoryBrandMap={categoryBrandMap}
      />

      <SavedSearchPanel
        isLoggedIn={isLoggedIn}
        il={il}
        kategoriId={selectedCategory?.id ?? null}
        markaId={selectedBrand?.id ?? null}
        initialSearches={savedSearches}
      />

      {listings.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-gray-100 rounded-2xl p-10 text-center text-gray-400 text-sm">
          {page > 1
            ? "Bu sayfada ilan yok."
            : il
            ? "Bu ilde henüz ilan yok. Veri birikiyor — ilk sen ol."
            : "Henüz ilan yok. Veri birikiyor — ilk sen ol."}
        </div>
      ) : (
        <div className="space-y-4">
          {listings.map((listing) => {
            const listingVehicle: VehicleFacts = {
              categoryId: listing.product.categoryId,
              brandId: listing.product.brandId,
              city: listing.city,
              damageStatus: listing.damageStatus,
              year: listing.product.year,
              km: listing.userProduct?.usageUnit === "km" ? listing.userProduct.usageAmount : null,
              ...fuelTransmissionFromAttributes(listing.product.attributes),
            };
            const listingWant: WantCriteria = {
              wantCategoryId: listing.wantCategoryId,
              wantBrandId: listing.wantBrandId,
              wantLocationScope: listing.wantLocationScope as LocationScope,
              wantDamageStatuses: listing.wantDamageStatuses as DamageStatus[],
              city: listing.city,
              wantYearMin: listing.wantYearMin,
              wantYearMax: listing.wantYearMax,
              wantKmMin: listing.wantKmMin,
              wantKmMax: listing.wantKmMax,
              wantFuelTypes: listing.wantFuelTypes as TradeFuelType[],
              wantTransmissions: listing.wantTransmissions,
            };
            const isMatch =
              myWant && myVehicle
                ? matchesWant(myWant, listingVehicle) && matchesWant(listingWant, myVehicle)
                : false;
            return <TradeCard key={listing.id} listing={listing} isMatch={isMatch} />;
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6 text-sm">
          {page > 1 ? (
            <Link href={pageHref(page - 1)} className="font-semibold text-indigo-700 hover:underline">
              ← Önceki
            </Link>
          ) : <span />}
          <span className="text-xs text-gray-400">Sayfa {page} / {totalPages}</span>
          {page < totalPages ? (
            <Link href={pageHref(page + 1)} className="font-semibold text-indigo-700 hover:underline">
              Sonraki →
            </Link>
          ) : <span />}
        </div>
      )}
    </div>
  );
}

// Serbest metin aramalı sorgularda DB'den çekilecek üst sınır — diğer filtreler
// (il/kategori/marka/yıl/km/yakıt/vites) bu sorgunun İÇİNDE zaten uygulanır,
// bu sadece o daraltılmış kümenin üzerine bir güvenlik tavanı (bkz. yorum,
// fetchListings başı).
const FREE_TEXT_FETCH_CAP = 500;

async function fetchListings(
  il: string,
  kategoriSlug: string | undefined,
  markaSlug: string | undefined,
  odemeNiyeti: string | undefined,
  yilMin: number | undefined,
  yilMax: number | undefined,
  kmMin: number | undefined,
  kmMax: number | undefined,
  yakit: string,
  vites: string,
  q: string,
  page: number
) {
  const paymentIntent =
    odemeNiyeti === "SWAP_ONLY" || odemeNiyeti === "PAYS_EXTRA" || odemeNiyeti === "WANTS_EXTRA"
      ? odemeNiyeti
      : undefined;

  // Kategori/marka filtresi artık sorgunun KENDİSİNDE (product ilişkisi üzerinden) — önceden
  // önce en yeni 50 ilan çekilip filtre JS'te sonradan uygulanıyordu, envanter büyüdükçe
  // filtreye uyan ama daha eski bir ilan sorgudan hiç dönmüyordu (bkz. denetim raporu, KRİTİK
  // madde). Artık hem doğru sonuç veriyor hem gerçek sayfalama (skip/take) destekliyor.
  // Yıl/km filtresi de aynı denetim raporunun ORTA maddesi — mevcut product.year ve
  // userProduct.usageAmount alanları üzerinden, yeni bir veri toplamaya gerek kalmadan.
  // Yakıt/vites filtresi Product.attributes (JSON) içindeki fuel_type/transmission
  // alanlarına Prisma'nın JSON path sorgusuyla uygulanıyor.
  const where: Prisma.TradeListingWhereInput = {
    isActive: true,
    ...(il ? { city: il } : {}),
    ...(paymentIntent ? { paymentIntent } : {}),
    ...(kategoriSlug || markaSlug || yilMin != null || yilMax != null || yakit || vites
      ? {
          product: {
            ...(kategoriSlug ? { category: { slug: kategoriSlug } } : {}),
            ...(markaSlug ? { brand: { slug: markaSlug } } : {}),
            ...(yilMin != null || yilMax != null
              ? { year: { ...(yilMin != null ? { gte: yilMin } : {}), ...(yilMax != null ? { lte: yilMax } : {}) } }
              : {}),
            // İkisi de aynı "attributes" JSON alanını hedeflediği için tek bir
            // object literal'da spread edilirse ikincisi birinciyi ezer (aynı
            // key iki kez yazılmış olur) — bu yüzden AND array'i ile ayrı
            // koşullar olarak birleştiriliyor (bkz. bug: yakıt+vites birlikte
            // seçilince yakıt filtresi sessizce kayboluyordu).
            ...(yakit || vites
              ? {
                  AND: [
                    ...(yakit ? [{ attributes: { path: ["fuel_type"], equals: yakit } }] : []),
                    ...(vites ? [{ attributes: { path: ["transmission"], equals: vites } }] : []),
                  ],
                }
              : {}),
          },
        }
      : {}),
    // Km beyan edilmemiş ilanlar (usageAmount null) filtre uygulanınca yanlışlıkla
    // elenmesin — bilinmeyen km "belki uyuyor" anlamına gelir, "uymuyor" değil
    // (bkz. kullanıcı geri bildirimi). kmMin/kmMax ayrı ayrı ya da birlikte
    // verilebilir, ikisi de aynı "usageAmount null ise dokunma" ilkesini paylaşır.
    ...(kmMin != null || kmMax != null
      ? {
          OR: [
            {
              userProduct: {
                usageUnit: "km",
                usageAmount: {
                  ...(kmMin != null ? { gte: kmMin } : {}),
                  ...(kmMax != null ? { lte: kmMax } : {}),
                },
              },
            },
            { userProduct: { usageAmount: null } },
          ],
        }
      : {}),
  };

  const include = {
    product: { include: { brand: true, model: true, category: true } },
    // Km bilgisi Garaj'da zaten toplanıyordu ama Takas kartında/detayında hiç
    // gösterilmiyordu (bkz. denetim raporu, YÜKSEK madde) — bir araç takasında
    // hasardan sonraki en kritik ikinci veri.
    userProduct: { select: { usageAmount: true, usageUnit: true } },
  } satisfies Prisma.TradeListingInclude;

  let listings: Prisma.TradeListingGetPayload<{ include: typeof include }>[];
  let total: number;

  if (q) {
    // Serbest metin arama — ana site aramasındaki (/arama) gibi aksan-duyarsız,
    // JS tarafında .includes() ile. Aynı "Kritik" ölçeklenebilirlik hatasını
    // tekrarlamamak için: diğer filtreler ÖNCE DB seviyesinde uygulanır, sadece
    // o (zaten daraltılmış + tavanlı) küme üzerinde metin araması yapılır,
    // sayfalama bundan SONRA (JS'te) uygulanır (bkz. kullanıcı onayı).
    const nq = normalize(q);
    const candidates = await prisma.tradeListing.findMany({
      where,
      include,
      orderBy: { effectiveDate: "desc" },
      take: FREE_TEXT_FETCH_CAP,
    });
    const filtered = candidates.filter((l) => {
      const p = l.product;
      return (
        normalize(p.name).includes(nq) ||
        normalize(p.brand.name).includes(nq) ||
        normalize(p.model.name).includes(nq) ||
        (p.trimName ? normalize(p.trimName).includes(nq) : false)
      );
    });
    total = filtered.length;
    listings = filtered.slice((page - 1) * PAGE_SIZE, (page - 1) * PAGE_SIZE + PAGE_SIZE);
  } else {
    [listings, total] = await Promise.all([
      prisma.tradeListing.findMany({
        where,
        include,
        // effectiveDate: createdAt'la aynı başlar, "İlan Yenile" ile tekrar now()'a
        // set edilir — createdAt'ın kendisi (ilanın gerçek açılış tarihi) korunur.
        orderBy: { effectiveDate: "desc" },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
      }),
      prisma.tradeListing.count({ where }),
    ]);
  }

  // İlan açmak için zaten onaylı fotoğraflı bir yorum şart koşuluyor (bkz. api/trades/route.ts),
  // yani fotoğraf her ilan için mevcut — sadece burada join edilip karta taşınıyor.
  const coverPhotoByUserProductId = await fetchCoverPhotos(listings.map((l) => l.userProductId));

  return {
    listings: listings.map((l) => ({
      ...l,
      coverPhotoUrl: coverPhotoByUserProductId.get(l.userProductId) ?? null,
    })),
    total,
  };
}

async function fetchCoverPhotos(userProductIds: number[]) {
  const map = new Map<number, string>();
  if (userProductIds.length === 0) return map;

  const photos = await prisma.productPhoto.findMany({
    where: {
      status: "APPROVED",
      review: { status: "PUBLISHED", userProductId: { in: userProductIds } },
    },
    orderBy: { order: "asc" },
    select: { url: true, review: { select: { userProductId: true } } },
  });

  for (const p of photos) {
    const upid = p.review?.userProductId;
    if (upid != null && !map.has(upid)) map.set(upid, p.url);
  }
  return map;
}
