import type { Metadata } from "next";
import Link from "next/link";
import { Prisma } from "@/generated/prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { TURKISH_CITIES } from "@/lib/turkishCities";
import { TradeCard } from "./TradeCard";
import { TakasFilterForm } from "./TakasFilterForm";
import { SavedSearchPanel } from "./SavedSearchPanel";

const PAGE_SIZE = 20;

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ il?: string; kategori?: string; marka?: string; odeme?: string; sayfa?: string }>;
}): Promise<Metadata> {
  const params = await searchParams;
  const isFiltered = !!(params.il || params.kategori || params.marka || params.odeme || params.sayfa);
  return {
    title: "Araç Takas İlanları – fikape",
    robots: isFiltered ? { index: false, follow: true } : undefined,
    alternates: { canonical: "/takas" },
  };
}

export default async function TakasPage({
  searchParams,
}: {
  searchParams: Promise<{ il?: string; kategori?: string; marka?: string; odeme?: string; sayfa?: string }>;
}) {
  const params = await searchParams;
  const il = params.il ?? "";
  const page = Math.max(1, parseInt(params.sayfa ?? "1") || 1);

  // İl seçilmemişse artık tüm Türkiye'deki ilanlar gösteriliyor (önceden boş sayfa gösterip
  // platformun envanterini hiç göstermiyordu — bkz. denetim raporu).
  const { listings, total } = await fetchListings(il, params.kategori, params.marka, params.odeme, page);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // Mevcut filtreleri koruyarak sayfa linki üretir (pagination kontrolleri için).
  function pageHref(targetPage: number) {
    const qs = new URLSearchParams();
    if (il) qs.set("il", il);
    if (params.kategori) qs.set("kategori", params.kategori);
    if (params.marka) qs.set("marka", params.marka);
    if (params.odeme) qs.set("odeme", params.odeme);
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
          {listings.map((listing) => (
            <TradeCard key={listing.id} listing={listing} />
          ))}
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

async function fetchListings(
  il: string,
  kategoriSlug: string | undefined,
  markaSlug: string | undefined,
  odemeNiyeti: string | undefined,
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
  const where: Prisma.TradeListingWhereInput = {
    isActive: true,
    ...(il ? { city: il } : {}),
    ...(paymentIntent ? { paymentIntent } : {}),
    ...(kategoriSlug || markaSlug
      ? {
          product: {
            ...(kategoriSlug ? { category: { slug: kategoriSlug } } : {}),
            ...(markaSlug ? { brand: { slug: markaSlug } } : {}),
          },
        }
      : {}),
  };

  const [listings, total] = await Promise.all([
    prisma.tradeListing.findMany({
      where,
      include: {
        product: { include: { brand: true, model: true, category: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.tradeListing.count({ where }),
  ]);

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
