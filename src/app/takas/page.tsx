import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { TURKISH_CITIES } from "@/lib/turkishCities";
import { TradeCard } from "./TradeCard";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ il?: string; kategori?: string; marka?: string }>;
}): Promise<Metadata> {
  const params = await searchParams;
  const isFiltered = !!(params.il || params.kategori || params.marka);
  return {
    title: "Araç Takas İlanları – fikape",
    robots: isFiltered ? { index: false, follow: true } : undefined,
    alternates: { canonical: "/takas" },
  };
}

export default async function TakasPage({
  searchParams,
}: {
  searchParams: Promise<{ il?: string; kategori?: string; marka?: string }>;
}) {
  const params = await searchParams;
  const il = params.il ?? "";

  let listings: Awaited<ReturnType<typeof fetchListings>> = [];
  if (il) {
    listings = await fetchListings(il, params.kategori, params.marka);
  }

  const categories = await prisma.category.findMany({
    where: { isActive: true },
    select: { id: true, slug: true, name: true },
    orderBy: { sortOrder: "asc" },
  }).catch(() => []);
  const brands = await prisma.brand.findMany({
    where: { isActive: true },
    select: { id: true, slug: true, name: true },
    orderBy: { name: "asc" },
  }).catch(() => []);

  return (
    <div className="max-w-3xl w-full mx-auto px-4 py-10">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-gray-900">Araç Takas İlanları</h1>
        <p className="text-sm text-gray-500 mt-1">Aracını takasa açan kullanıcıları keşfet.</p>
      </div>

      <form method="get" className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-8">
        <select name="il" defaultValue={il} className="text-sm rounded-lg border border-gray-200 px-2.5 py-1.5">
          <option value="">İl seçiniz</option>
          {TURKISH_CITIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <select name="kategori" defaultValue={params.kategori ?? ""} className="text-sm rounded-lg border border-gray-200 px-2.5 py-1.5">
          <option value="">Tüm kategoriler</option>
          {categories.map((c) => (
            <option key={c.id} value={c.slug}>{c.name}</option>
          ))}
        </select>
        <select name="marka" defaultValue={params.marka ?? ""} className="text-sm rounded-lg border border-gray-200 px-2.5 py-1.5">
          <option value="">Tüm markalar</option>
          {brands.map((b) => (
            <option key={b.id} value={b.slug}>{b.name}</option>
          ))}
        </select>
        <button type="submit" className="sm:col-span-3 text-sm font-semibold text-white rounded-lg px-3 py-1.5" style={{ background: "#4338ca" }}>
          Filtrele
        </button>
      </form>

      {!il ? (
        <div className="bg-white border-2 border-dashed border-gray-100 rounded-2xl p-10 text-center text-gray-400 text-sm">
          Önce ilinizi seçiniz.
        </div>
      ) : listings.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-gray-100 rounded-2xl p-10 text-center text-gray-400 text-sm">
          Bu ilde henüz ilan yok. Veri birikiyor — ilk sen ol.
        </div>
      ) : (
        <div className="space-y-4">
          {listings.map((listing) => (
            <TradeCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}
    </div>
  );
}

async function fetchListings(il: string, kategoriSlug?: string, markaSlug?: string) {
  const listings = await prisma.tradeListing.findMany({
    where: { isActive: true, city: il },
    include: {
      product: { include: { brand: true, model: true, category: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return listings.filter((l) => {
    if (kategoriSlug && l.product.category.slug !== kategoriSlug) return false;
    if (markaSlug && l.product.brand.slug !== markaSlug) return false;
    return true;
  });
}
