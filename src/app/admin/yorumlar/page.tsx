import { prisma } from "@/lib/prisma";
import { ModerationClient } from "./ModerationClient";
import { hammingDistance, PHASH_DUPLICATE_THRESHOLD } from "@/lib/phash";

export const metadata = { title: "Moderasyon — fikape admin" };

function hoursAgo(hours: number): Date {
  return new Date(Date.now() - hours * 60 * 60 * 1000);
}

export default async function ModerationPage() {
  const reviews = await prisma.review.findMany({
    // PENDING: yeni yorum. PUBLISHED + en az 1 PENDING foto: zaten yayınlanmış
    // bir yorum düzenlenirken sonradan eklenen fotoğraf(lar) — bunlar da
    // moderasyon bekliyor ama yorumun kendisi zaten onaylı, ayrı ele alınır
    // (bkz. ModerationClient'taki "sadece fotoğraf" dalı).
    where: {
      OR: [
        { status: "PENDING" },
        { status: "PUBLISHED", photos: { some: { status: "PENDING" } } },
      ],
    },
    select: {
      id: true,
      status: true,
      productId: true,
      summaryText: true,
      detailText: true,
      extendedData: true,
      scoreFiyat: true,
      scoreKalite: true,
      scorePerformans: true,
      scoreOverall: true,
      wouldBuyAgain: true,
      ownershipMonthsAtReview: true,
      createdAt: true,
      user: { select: { email: true, displayName: true } },
      product: {
        select: {
          name: true,
          slug: true,
          model: { select: { name: true, brand: { select: { name: true } } } },
        },
      },
      photos: { select: { id: true, url: true, phash: true, status: true }, orderBy: { order: "asc" } },
      ipHash: true,
    },
    orderBy: { createdAt: "asc" },
  });

  const ipHashes = [...new Set(reviews.map((r) => r.ipHash).filter((h): h is string => !!h))];
  const ipCounts = ipHashes.length
    ? await prisma.review.groupBy({
        by: ["ipHash"],
        where: { ipHash: { in: ipHashes } },
        _count: { id: true },
      })
    : [];
  const ipCountMap = new Map(ipCounts.map((c) => [c.ipHash, c._count.id]));

  // Chip kombinasyonu tekrar tespiti — aynı ürün için aynı artı/eksi seti
  // kısa sürede tekrarlanırsa (kopyala-yapıştır yorum bombardımanı sinyali).
  function comboKey(productId: number, extendedData: unknown): string {
    const ext = extendedData as Record<string, unknown> | null | undefined;
    const pros = ((ext?.pros as string[] | undefined) ?? []).slice().sort();
    const cons = ((ext?.cons as string[] | undefined) ?? []).slice().sort();
    return `${productId}:${pros.join(",")}|${cons.join(",")}`;
  }

  const productIds = [...new Set(reviews.map((r) => r.productId))];
  const productReviews = productIds.length
    ? await prisma.review.findMany({
        where: { productId: { in: productIds }, status: { in: ["PENDING", "PUBLISHED"] } },
        select: { productId: true, extendedData: true },
      })
    : [];
  const comboCountMap = new Map<string, number>();
  for (const r of productReviews) {
    const key = comboKey(r.productId, r.extendedData);
    comboCountMap.set(key, (comboCountMap.get(key) ?? 0) + 1);
  }

  // Fotoğraf tekrar kullanımı tespiti (pHash) — aynı ürüne ait başka bir yorumun
  // fotoğrafına görsel olarak neredeyse aynıysa (Hamming mesafesi eşik altında) uyar.
  const productPhotos = productIds.length
    ? await prisma.productPhoto.findMany({
        where: { productId: { in: productIds }, status: { in: ["PENDING", "APPROVED"] }, phash: { not: null } },
        select: { id: true, productId: true, phash: true },
      })
    : [];
  const photosByProduct = new Map<number, { id: number; phash: string }[]>();
  for (const p of productPhotos) {
    if (!p.phash) continue;
    const list = photosByProduct.get(p.productId) ?? [];
    list.push({ id: p.id, phash: p.phash });
    photosByProduct.set(p.productId, list);
  }
  function isDuplicatePhoto(productId: number, photoId: number, phash: string | null): boolean {
    if (!phash) return false;
    const candidates = photosByProduct.get(productId) ?? [];
    return candidates.some((c) => c.id !== photoId && hammingDistance(c.phash, phash) <= PHASH_DUPLICATE_THRESHOLD);
  }

  // Ürün bazlı anomali/hız tespiti — kısa sürede aynı ürüne çok sayıda
  // yorum gelirse (review bombing sinyali). 24 saatlik pencere, sabit eşik
  // (z-score/istatistiksel model için henüz yeterli veri hacmi yok).
  const RECENT_WINDOW_HOURS = 24;
  const recentSince = hoursAgo(RECENT_WINDOW_HOURS);
  const recentCounts = productIds.length
    ? await prisma.review.groupBy({
        by: ["productId"],
        where: { productId: { in: productIds }, status: { in: ["PENDING", "PUBLISHED"] }, createdAt: { gte: recentSince } },
        _count: { id: true },
      })
    : [];
  const recentCountMap = new Map(recentCounts.map((c) => [c.productId, c._count.id]));

  function hasChips(extendedData: unknown): boolean {
    const ext = extendedData as Record<string, unknown> | null | undefined;
    const pros = (ext?.pros as string[] | undefined) ?? [];
    const cons = (ext?.cons as string[] | undefined) ?? [];
    return pros.length > 0 || cons.length > 0;
  }

  const serialized = reviews.map(({ ipHash, productId, photos, status, ...r }) => ({
    ...r,
    // Sorgu sadece PENDING veya (PUBLISHED + bekleyen foto) getirir, diğer
    // durumlar hiç gelmez — ModerationClient'ın daraltılmış union'ına eşlenir.
    status: status as "PENDING" | "PUBLISHED",
    createdAt: r.createdAt.toISOString(),
    sameIpCount: ipHash ? (ipCountMap.get(ipHash) ?? 1) : 0,
    // Sıfır-sürtünmeli hızlı puanların hepsi boş artı/eksi setini paylaşıyor —
    // bunu "tekrar" olarak flag'lememek için chip'i olmayan yorumlarda sinyal atlanır.
    sameChipComboCount: hasChips(r.extendedData) ? (comboCountMap.get(comboKey(productId, r.extendedData)) ?? 1) : 1,
    recentProductReviewCount: recentCountMap.get(productId) ?? 1,
    photos: photos.map(({ phash, ...p }) => ({ ...p, isDuplicate: isDuplicatePhoto(productId, p.id, phash) })),
  }));

  return (
    <div className="px-8 py-10 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-gray-900">Yorumlar</h1>
        <p className="text-sm text-gray-500 mt-1">
          {reviews.length > 0
            ? `${reviews.length} yorum onay bekliyor`
            : "Bekleyen yorum yok"}
        </p>
        <p className="text-xs text-gray-400 mt-1">
          &quot;Zaten Yayında&quot; etiketli kartlar, onaylı bir yoruma düzenleme sırasında sonradan eklenen fotoğraflardır — sadece fotoğraf(lar) onaylanır/reddedilir, yorumun kendisi etkilenmez.
        </p>
      </div>
      <ModerationClient initialReviews={serialized} />
    </div>
  );
}
