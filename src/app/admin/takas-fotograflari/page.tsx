import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { hammingDistance, PHASH_DUPLICATE_THRESHOLD } from "@/lib/phash";
import { TradePhotoActions } from "./TradePhotoActions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Takas Fotoğrafları — Admin",
  robots: { index: false },
};

export default async function TakasFotograflariPage() {
  const pending = await prisma.tradeListingPhoto.findMany({
    where: { status: "PENDING", tradeListing: { isActive: true } },
    orderBy: { createdAt: "asc" },
    select: {
      id: true, url: true, phash: true, createdAt: true,
      tradeListing: {
        select: {
          id: true, productId: true,
          user: { select: { displayName: true } },
          product: { select: { brand: { select: { name: true } }, model: { select: { name: true } } } },
        },
      },
    },
  });

  // Tekrar tespiti — aynı ürüne ait başka bir takas fotoğrafının (PENDING/APPROVED)
  // pHash'ine çok yakınsa "tekrar" işaretlenir (sahibinden/başka ilandan aşırma).
  const productIds = [...new Set(pending.map((p) => p.tradeListing.productId))];
  const others = productIds.length
    ? await prisma.tradeListingPhoto.findMany({
        where: {
          tradeListing: { productId: { in: productIds } },
          status: { in: ["PENDING", "APPROVED"] },
          phash: { not: null },
        },
        select: { id: true, phash: true, tradeListing: { select: { productId: true } } },
      })
    : [];
  const byProduct = new Map<number, { id: number; phash: string }[]>();
  for (const o of others) {
    if (!o.phash) continue;
    const list = byProduct.get(o.tradeListing.productId) ?? [];
    list.push({ id: o.id, phash: o.phash });
    byProduct.set(o.tradeListing.productId, list);
  }
  function isDuplicate(productId: number, photoId: number, phash: string | null): boolean {
    if (!phash) return false;
    return (byProduct.get(productId) ?? []).some(
      (c) => c.id !== photoId && hammingDistance(c.phash, phash) <= PHASH_DUPLICATE_THRESHOLD,
    );
  }

  return (
    <div className="px-4 sm:px-8 py-10 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
          Takas Fotoğrafları
          {pending.length > 0 && (
            <span className="px-2 py-0.5 rounded-full text-sm font-bold bg-orange-100 text-orange-700">
              {pending.length} bekliyor
            </span>
          )}
        </h1>
        <p className="text-sm text-gray-400 mt-1">
          Takas ilanlarına eklenen, moderasyon bekleyen fotoğraflar. Plaka / yüz / kişisel belge / iletişim
          bilgisi içerenleri reddediniz.
        </p>
      </div>

      {pending.length === 0 ? (
        <p className="text-sm text-gray-400">Bekleyen fotoğraf yok.</p>
      ) : (
        <div className="space-y-3">
          {pending.map((p) => {
            const t = p.tradeListing;
            const vehicle = `${t.product.brand.name} ${t.product.model.name}`;
            const dup = isDuplicate(t.productId, p.id, p.phash);
            return (
              <div key={p.id} className="bg-white border border-gray-100 rounded-xl p-4 flex gap-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.url} alt="" className="w-32 h-32 rounded-lg object-cover shrink-0 bg-gray-100" />
                <div className="min-w-0 flex-1 flex flex-col">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link href={`/takas/${t.id}`} className="font-semibold text-gray-800 hover:underline truncate">
                      {vehicle}
                    </Link>
                    {dup && (
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-red-100 text-red-700">
                        tekrar olabilir
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {t.user.displayName ?? "Kullanıcı"} yükledi ·{" "}
                    {p.createdAt.toLocaleDateString("tr-TR", { day: "numeric", month: "long" })}
                  </p>
                  <div className="mt-auto pt-3 flex items-center justify-between gap-2">
                    <a href={p.url} target="_blank" rel="noopener noreferrer" className="text-xs text-gray-400 hover:underline">
                      Büyük görüntüle →
                    </a>
                    <TradePhotoActions photoId={p.id} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
