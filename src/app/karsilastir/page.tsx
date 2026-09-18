import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { BASE_URL } from "@/lib/baseUrl";
import { JsonLd } from "@/components/JsonLd";
import { FikapeScore } from "@/components/FikapeScore";
import { AiSummaryCard } from "@/components/AiSummaryCard";
import { ComparePicker } from "./ComparePicker";
import { stripModelGenRange, splitTrimName } from "@/lib/modelDisplay";
import { MAX_COMPARE_ITEMS } from "@/lib/compare/constants";
import { buildSpecComparisonRows } from "@/lib/compare/buildSpecComparisonRows";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ urunler?: string }>;
}): Promise<Metadata> {
  const { urunler } = await searchParams;
  const slugs = parseSlugs(urunler);
  if (slugs.length < 2) {
    return {
      title: "Araç Karşılaştır",
      description: "İki veya daha fazla aracı fikape kullanıcı puanlarına göre yan yana karşılaştır.",
    };
  }
  const matched = await prisma.product.findMany({
    where: { slug: { in: slugs }, isActive: true },
    select: {
      slug: true,
      trimName: true,
      category: { select: { id: true } },
      model: { select: { name: true, brand: { select: { name: true } } } },
    },
  });
  const products = orderAndLockCategory(matched, slugs);
  const names = products
    .map((p) => `${p.model.brand.name} ${splitTrimName(p.trimName)?.version ?? stripModelGenRange(p.model.name)}`)
    .join(" vs ");
  return {
    title: `${names} Karşılaştırma`,
    description: `${names} — fikape kullanıcı yorumlarına dayalı FI·KA·PE skor karşılaştırması.`,
  };
}

function parseSlugs(raw?: string): string[] {
  if (!raw) return [];
  return [...new Set(raw.split(",").map((s) => s.trim()).filter(Boolean))].slice(0, MAX_COMPARE_ITEMS);
}

// Prisma `findMany({ where: { slug: { in: slugs } } })` kullanıcının URL'deki
// sırasını korumaz (genelde id sırasına göre döner) — bu hem "ilk seçilen aracın
// kategorisi kilitlenir" mantığını hem de kart render sırasını bozar. Burada
// sonuçlar önce slugs sırasına göre diziliyor, sonra ilk aracın kategorisiyle
// uyuşmayanlar elenip kilit gerçekten "ilk seçilen" araca göre uygulanıyor.
function orderAndLockCategory<T extends { slug: string; category: { id: number } | null }>(
  matched: T[],
  slugs: string[]
): T[] {
  const bySlug = new Map(matched.map((p) => [p.slug, p]));
  const ordered = slugs.map((s) => bySlug.get(s)).filter((p): p is T => Boolean(p));
  const lockedCategoryId = ordered[0]?.category?.id ?? null;
  return lockedCategoryId ? ordered.filter((p) => p.category?.id === lockedCategoryId) : ordered;
}

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ urunler?: string }>;
}) {
  const { urunler } = await searchParams;
  const slugs = parseSlugs(urunler);

  const matchedProducts = slugs.length
    ? await prisma.product.findMany({
        where: { slug: { in: slugs }, isActive: true },
        select: {
          id: true,
          slug: true,
          name: true,
          year: true,
          trimName: true,
          imageUrl: true,
          attributes: true,
          category: { select: { id: true, name: true, slug: true } },
          model: { select: { name: true, brand: { select: { name: true } } } },
        },
      })
    : [];

  // Karşılaştırma anlamsız olmasın diye (otomobil vs motosiklet gibi) sadece ilk
  // seçilen aracın kategorisiyle aynı kategorideki araçlar tutulur — bu server-side
  // kilit, URL'nin elle değiştirilmesine karşı da geçerli.
  const products = orderAndLockCategory(matchedProducts, slugs);
  const droppedCount = matchedProducts.length - products.length;

  const aggByProductId = new Map<number, { avg: number; count: number; fi: number; ka: number; pe: number }>();
  if (products.length) {
    const groups = await prisma.review.groupBy({
      by: ["productId"],
      where: { productId: { in: products.map((p) => p.id) }, status: "PUBLISHED" },
      _avg: { scoreOverall: true, scoreFiyat: true, scoreKalite: true, scorePerformans: true },
      _count: { id: true },
    });
    groups.forEach((g) => {
      aggByProductId.set(g.productId, {
        avg: g._avg.scoreOverall ?? 0,
        count: g._count.id,
        fi: g._avg.scoreFiyat ?? 0,
        ka: g._avg.scoreKalite ?? 0,
        pe: g._avg.scorePerformans ?? 0,
      });
    });
  }

  const aiSummaryByProductId = new Map<number, { mode: "SINGLE_CARD" | "REVIEWS_SUMMARY"; summaryText: string; reviewCountAtGeneration: number | null }>();
  if (products.length) {
    const summaries = await prisma.aiVehicleSummary.findMany({
      where: { productId: { in: products.map((p) => p.id) }, status: "APPROVED" },
      select: { productId: true, mode: true, summaryText: true, reviewCountAtGeneration: true },
    });
    summaries.forEach((s) => aiSummaryByProductId.set(s.productId, s));
  }

  const specRows = products.length >= 2 && products[0].category
    ? buildSpecComparisonRows(products[0].category.slug, products.map((p) => p.attributes))
    : [];

  const comparisonSchema =
    products.length >= 2
      ? {
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: "fikape araç karşılaştırması",
          itemListElement: products.map((p, i) => ({
            "@type": "ListItem",
            position: i + 1,
            url: `${BASE_URL}/araclar/${p.slug}`,
            name: `${p.model.brand.name} ${splitTrimName(p.trimName)?.version ?? stripModelGenRange(p.model.name)}${p.year ? ` ${p.year}` : ""}`,
          })),
        }
      : null;

  return (
    <>
      {comparisonSchema && <JsonLd data={comparisonSchema} />}

      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="mb-8">
          <Link href="/" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
            ← Ana sayfaya dön
          </Link>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">Araç Karşılaştır</h1>
        <p className="text-sm text-gray-400 mb-8">
          fikape kullanıcı yorumlarına dayalı, iki veya daha fazla aracı yan yana karşılaştır.
        </p>

        {droppedCount > 0 && (
          <p className="text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 mb-4">
            Farklı kategoriden {droppedCount} araç karşılaştırmadan çıkarıldı — aynı anda sadece aynı kategoriden araçlar (örn. hepsi otomobil) karşılaştırılabiliyor.
          </p>
        )}

        <ComparePicker
          initial={products.map((p) => ({
            slug: p.slug,
            name: `${p.model.brand.name} ${splitTrimName(p.trimName)?.version ?? stripModelGenRange(p.model.name)}${p.year ? ` ${p.year}` : ""}`,
            categorySlug: p.category?.slug ?? null,
          }))}
        />

        {products.length >= 2 && (
          <div className="grid gap-5" style={{ gridTemplateColumns: `repeat(${products.length}, minmax(0, 1fr))` }}>
            {products.map((p) => {
              const agg = aggByProductId.get(p.id) ?? { avg: 0, count: 0, fi: 0, ka: 0, pe: 0 };
              const trimSplit = splitTrimName(p.trimName);
              return (
                <div key={p.slug} className="bg-white border border-gray-100 rounded-2xl p-4">
                  {p.imageUrl && (
                    <div className="relative w-full aspect-[4/3] mb-3 rounded-xl overflow-hidden bg-gray-50">
                      <Image src={p.imageUrl} alt={`${p.model.brand.name} ${stripModelGenRange(p.model.name)}`} fill className="object-contain p-2" />
                    </div>
                  )}
                  <div className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">{p.model.brand.name}</div>
                  <Link href={`/araclar/${p.slug}`} className="font-bold text-gray-900 hover:underline">
                    {trimSplit ? trimSplit.version : stripModelGenRange(p.model.name)}{p.year ? ` ${p.year}` : ""}
                  </Link>
                  {trimSplit ? (
                    <p className="text-xs text-gray-400 mt-0.5">{trimSplit.donanim}</p>
                  ) : (
                    p.trimName && <p className="text-xs text-gray-400 mt-0.5">{p.trimName}</p>
                  )}

                  {agg.count > 0 ? (
                    <div className="mt-3">
                      <FikapeScore
                        variant="bars"
                        reviewCount={agg.count}
                        scores={{ scoreFiyat: agg.fi, scoreKalite: agg.ka, scorePerformans: agg.pe, scoreOverall: agg.avg }}
                      />
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 mt-3">Veri birikiyor — henüz yorum yok.</p>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {products.length >= 2 && specRows.length > 0 && (
          <div className="mt-8">
            <h2 className="text-lg font-bold text-gray-900 mb-3">Teknik Özellikler</h2>
            <div className="overflow-x-auto border border-gray-100 rounded-2xl">
              <table className="w-full text-sm border-collapse">
                <tbody>
                  {specRows.map((row) => (
                    <tr key={row.label} className="border-b border-gray-100 last:border-0">
                      <th
                        scope="row"
                        className="sticky left-0 bg-gray-50 text-left font-semibold text-gray-500 text-xs uppercase tracking-wide px-3 py-2.5 whitespace-nowrap"
                      >
                        {row.label}
                      </th>
                      {row.values.map((value, i) => {
                        const isBest = row.bestIndices.includes(i);
                        return (
                          <td
                            key={i}
                            className={`px-3 py-2.5 text-gray-900 ${isBest ? "bg-emerald-50 font-semibold" : ""}`}
                          >
                            {value ?? <span className="text-gray-300">—</span>}
                            {isBest && <span className="text-emerald-600 ml-1" aria-label="en iyi değer">✓</span>}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {products.length >= 2 && (
          <div className="mt-8">
            <h2 className="text-lg font-bold text-gray-900 mb-3">AI Özeti</h2>
            <div className="grid gap-5" style={{ gridTemplateColumns: `repeat(${products.length}, minmax(0, 1fr))` }}>
              {products.map((p) => {
                const summary = aiSummaryByProductId.get(p.id);
                return summary ? (
                  <AiSummaryCard
                    key={p.slug}
                    mode={summary.mode}
                    summaryText={summary.summaryText}
                    variant="compare"
                    reviewCount={summary.reviewCountAtGeneration ?? undefined}
                  />
                ) : (
                  <div key={p.slug} className="rounded-2xl p-5 border border-gray-100 bg-gray-50">
                    <p className="text-xs text-gray-400">Henüz özet yok.</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
