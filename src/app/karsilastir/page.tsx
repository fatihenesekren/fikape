import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { BASE_URL } from "@/lib/baseUrl";
import { JsonLd } from "@/components/JsonLd";
import { FikapeScore } from "@/components/FikapeScore";
import { ComparePicker } from "./ComparePicker";
import { stripModelGenRange } from "@/lib/modelDisplay";

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
  const products = await prisma.product.findMany({
    where: { slug: { in: slugs } },
    select: { model: { select: { name: true, brand: { select: { name: true } } } } },
  });
  const names = products.map((p) => `${p.model.brand.name} ${stripModelGenRange(p.model.name)}`).join(" vs ");
  return {
    title: `${names} Karşılaştırma`,
    description: `${names} — fikape kullanıcı yorumlarına dayalı FI·KA·PE skor karşılaştırması.`,
  };
}

function parseSlugs(raw?: string): string[] {
  if (!raw) return [];
  return [...new Set(raw.split(",").map((s) => s.trim()).filter(Boolean))].slice(0, 4);
}

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ urunler?: string }>;
}) {
  const { urunler } = await searchParams;
  const slugs = parseSlugs(urunler);

  const products = slugs.length
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
          category: { select: { name: true } },
          model: { select: { name: true, brand: { select: { name: true } } } },
        },
      })
    : [];

  const aggByProductId = new Map<number, { avg: number; count: number; fi: number; ka: number; pe: number }>();
  if (products.length) {
    const aggs = await Promise.all(
      products.map((p) =>
        prisma.review.aggregate({
          where: { productId: p.id, status: "PUBLISHED" },
          _avg: { scoreOverall: true, scoreFiyat: true, scoreKalite: true, scorePerformans: true },
          _count: { id: true },
        })
      )
    );
    products.forEach((p, i) => {
      const a = aggs[i];
      aggByProductId.set(p.id, {
        avg: a._avg.scoreOverall ?? 0,
        count: a._count.id,
        fi: a._avg.scoreFiyat ?? 0,
        ka: a._avg.scoreKalite ?? 0,
        pe: a._avg.scorePerformans ?? 0,
      });
    });
  }

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
            name: `${p.model.brand.name} ${stripModelGenRange(p.model.name)}${p.year ? ` ${p.year}` : ""}`,
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
          fikape kullanıcı yorumlarına dayalı, iki veya daha fazla aracı yan yana karşılaştır. Ücretsiz.
        </p>

        <ComparePicker initial={products.map((p) => ({ slug: p.slug, name: `${p.model.brand.name} ${stripModelGenRange(p.model.name)}${p.year ? ` ${p.year}` : ""}` }))} />

        {products.length >= 2 && (
          <div className="grid gap-5" style={{ gridTemplateColumns: `repeat(${products.length}, minmax(0, 1fr))` }}>
            {products.map((p) => {
              const agg = aggByProductId.get(p.id)!;
              return (
                <div key={p.slug} className="bg-white border border-gray-100 rounded-2xl p-4">
                  {p.imageUrl && (
                    <div className="relative w-full aspect-[4/3] mb-3 rounded-xl overflow-hidden bg-gray-50">
                      <Image src={p.imageUrl} alt={`${p.model.brand.name} ${stripModelGenRange(p.model.name)}`} fill className="object-contain p-2" />
                    </div>
                  )}
                  <div className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">{p.model.brand.name}</div>
                  <Link href={`/araclar/${p.slug}`} className="font-bold text-gray-900 hover:underline">
                    {stripModelGenRange(p.model.name)}{p.year ? ` ${p.year}` : ""}
                  </Link>

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
      </div>
    </>
  );
}
