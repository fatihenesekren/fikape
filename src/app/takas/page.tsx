import type { Metadata } from "next";
import Link from "next/link";
import { Prisma } from "@/generated/prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { TURKISH_CITIES } from "@/lib/turkishCities";
import { getTakasFiltreSecenekleri } from "@/lib/takasFiltre";
import { TradeCard } from "./TradeCard";
import { TakasFilterForm } from "./TakasFilterForm";
import { SavedSearchPanel } from "./SavedSearchPanel";
import { searchParcalari, aramaKayitliMi } from "@/lib/savedSearchGoster";
import { takasFiltreVarMi, takasIndekslenebilirMi, bosDurumMetni } from "@/lib/takasFiltreKarari";
import { matchesWant, fuelTransmissionFromAttributes, type WantCriteria, type VehicleFacts } from "@/lib/tradeMatching";
import type { LocationScope, TradeFuelType } from "@/lib/tradeExpectations";
import type { DamageStatus } from "@/lib/damageStatus";

const PAGE_SIZE = 20;
const MAX_SAYFA = 50;

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
  return {
    title: "Araç Takas İlanları",
    robots: !takasIndekslenebilirMi(params) ? { index: false, follow: true } : undefined,
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
  // Üst sınır: botların çok derin offset sorguları çekmesini engeller (20'lik sayfada 1000 ilan).
  const page = Math.min(MAX_SAYFA, Math.max(1, parseInt(params.sayfa ?? "1") || 1));
  const yilMin = params.yilMin ? parseInt(params.yilMin) : undefined;
  const yilMax = params.yilMax ? parseInt(params.yilMax) : undefined;
  const kmMin = params.kmMin ? parseInt(params.kmMin) : undefined;
  const kmMax = params.kmMax ? parseInt(params.kmMax) : undefined;
  const yakit = params.yakit ?? "";
  const vites = params.vites ?? "";
  const q = (params.q ?? "").trim();
  // Filtre uygulanmış mı (sayfa numarası hariç) — boş sonuç "pazar boş" mu "filtre dar" mı ayrımı için.
  const filtreVar = takasFiltreVarMi(params);

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

  // Kategori/marka seçenekleri nadiren değişir — her istekte üç sorgu yerine önbellekten (lib/takasFiltre.ts).
  const { categories, brands, categoryBrandMap } = await getTakasFiltreSecenekleri().catch(() => ({
    categories: [] as { id: number; slug: string; name: string }[],
    brands: [] as { id: number; slug: string; name: string }[],
    categoryBrandMap: {} as Record<string, string[]>,
  }));

  const session = await auth();
  const isLoggedIn = !!session?.user?.id;
  const currentUserId = isLoggedIn ? Number(session!.user.id) : null;

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
        include: {
          category: { select: { name: true, slug: true } },
          brand: { select: { name: true, slug: true } },
        },
        orderBy: { createdAt: "desc" },
      }).catch(() => [])
    : [];

  const aramaParcalari = searchParcalari({
    id: 0, city: il,
    category: selectedCategory ? { name: selectedCategory.name, slug: selectedCategory.slug } : null,
    brand: selectedBrand ? { name: selectedBrand.name, slug: selectedBrand.slug } : null,
    paymentIntent: params.odeme || null,
    yearMin: yilMin ?? null, yearMax: yilMax ?? null, kmMin: kmMin ?? null, kmMax: kmMax ?? null,
    fuelTypes: yakit ? [yakit] : [], transmissions: vites ? [vites] : [],
  });
  // İl seçilmemişse searchParcalari ilk parça olarak boş il döndürür; çipte görünmesin.
  const cipler = il ? aramaParcalari : aramaParcalari.slice(1);
  const kaydedilebilirFiltre = Boolean(il || params.kategori || params.marka || params.odeme || yilMin != null || yilMax != null || kmMin != null || kmMax != null || yakit || vites);
  const zatenKayitli =
    isLoggedIn && Boolean(il) &&
    aramaKayitliMi(savedSearches, {
      city: il, categoryId: selectedCategory?.id ?? null, brandId: selectedBrand?.id ?? null,
      paymentIntent: params.odeme || null, yearMin: yilMin ?? null, yearMax: yilMax ?? null, kmMin: kmMin ?? null, kmMax: kmMax ?? null,
      fuelTypes: yakit ? [yakit] : [], transmissions: vites ? [vites] : [],
    });
  const bosDurum = bosDurumMetni({ il, isLoggedIn, kaydedilebilirFiltre, zatenKayitli });

  return (
    <div className="max-w-3xl w-full mx-auto px-4 py-10 flex flex-col gap-4">
      {/* Geri/Ana Sayfa dönüşü — önceden hiç yoktu, sayfaya nasıl gelindiyse
          (header logosu hariç) geri dönmenin bir yolu yoktu (bkz. kullanıcı
          geri bildirimi). araçlar/[slug]'daki "← Tüm araçlar" ile aynı
          yerleşim/stil (bkz. site geneli patern). */}
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-400 hover:text-gray-600 transition-colors self-start"
      >
        ← Ana Sayfa
      </Link>

      <div>
        <h1 className="text-2xl font-black text-gray-900">Araç Takas İlanları</h1>
        <p className="text-sm text-gray-500 mt-1">Aracını takasa açan kullanıcıları keşfet.</p>
      </div>

      <TakasFilterForm
        key={pageHref(1)}
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
        key={pageHref(1)}
        isLoggedIn={isLoggedIn}
        il={il}
        kategoriId={selectedCategory?.id ?? null}
        markaId={selectedBrand?.id ?? null}
        odemeNiyeti={params.odeme ?? ""}
        yilMin={yilMin ?? null}
        yilMax={yilMax ?? null}
        kmMin={kmMin ?? null}
        kmMax={kmMax ?? null}
        yakit={yakit}
        vites={vites}
        q={q}
        initialSearches={savedSearches}
        cipler={cipler}
        cities={TURKISH_CITIES}
        girisHref={`/giris?callbackUrl=${encodeURIComponent(pageHref(1))}`}
      />

      {listings.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-gray-100 rounded-2xl p-8 sm:p-10 text-center space-y-3">
          {page > 1 ? (
            <>
              <p className="text-sm text-gray-600">Bu sayfada ilan yok.</p>
              <Link href={pageHref(1)} className="inline-block text-sm font-semibold text-link hover:underline">
                İlk sayfaya dönün
              </Link>
            </>
          ) : filtreVar ? (
            <>
              <p className="text-sm text-gray-800">{bosDurum.baslik}</p>
              <p className="text-sm text-gray-600">{bosDurum.ipucu}</p>
              {bosDurum.kayitCumlesi && <p className="text-sm text-gray-600">{bosDurum.kayitCumlesi}</p>}
            </>
          ) : (
            <>
              <p className="text-sm font-semibold text-gray-800">Henüz ilan yok</p>
              <p className="text-sm text-gray-600">
                Garajınızdaki aracı takasa açarak ilk ilanlardan birini siz verebilirsiniz.
              </p>
              <Link
                href={isLoggedIn ? "/garajim" : "/giris?callbackUrl=%2Fgarajim"}
                className="inline-flex items-center justify-center min-h-11 px-5 rounded-xl text-sm font-semibold text-white"
                style={{ background: "var(--btn-dark)" }}
              >
                {isLoggedIn ? "Garajıma gidin" : "Giriş yapın"}
              </Link>
            </>
          )}
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
            // Kendi ilanı: "Sana Uygun" rozeti kendi aracını kendine önermiş
            // olur (eşleştirmeye güveni zedeler) — bu yüzden bastırılıyor ve
            // kartta bunun yerine "Sizin ilanınız" rozeti gösteriliyor (bkz.
            // kullanıcı kararı: Seçenek A).
            const isOwn = currentUserId != null && listing.userId === currentUserId;
            const isMatch =
              !isOwn && myWant && myVehicle
                ? matchesWant(myWant, listingVehicle) && matchesWant(listingWant, myVehicle)
                : false;
            return <TradeCard key={listing.id} listing={listing} isMatch={isMatch} isOwn={isOwn} />;
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          {page > 1 ? (
            <Link href={pageHref(page - 1)} className="font-semibold text-link hover:underline">
              ← Önceki
            </Link>
          ) : <span />}
          <span className="text-xs text-gray-400">Sayfa {page} / {totalPages}</span>
          {page < totalPages ? (
            <Link href={pageHref(page + 1)} className="font-semibold text-link hover:underline">
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
