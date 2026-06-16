import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { FikapeScore } from "@/components/FikapeScore";
import { ReviewCard } from "@/components/ReviewCard";
import { calcOverall } from "@/lib/fikape";
import { getVehicleImageUrl } from "@/lib/vehicleImages";
import type { FikapeScores } from "@/lib/fikape";
import { FUEL_LABELS, FUEL_ICONS, FUEL_COLORS } from "@/lib/fuel";

const BODY_LABELS: Record<string, string> = {
  sedan: "Sedan", suv: "SUV", hatchback: "Hatchback",
  mpv: "MPV", coupe: "Coupe", cabrio: "Cabriolet",
};

const BODY_ICONS: Record<string, string> = {
  suv: "🚙", sedan: "🚗", hatchback: "🚗", mpv: "🚐", coupe: "🏎", cabrio: "🏎",
};


export default async function VehicleDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ yorum?: string }>;
}) {
  const { slug } = await params;
  const { yorum } = await searchParams;

  const product = await prisma.product.findUnique({
    where: { slug },
    include: { brand: true, model: true, category: true },
  });

  if (!product) notFound();

  const attrs = product.attributes as Record<string, unknown>;
  const imageUrl = product.imageUrl ?? await getVehicleImageUrl(slug);
  const fuelType = String(attrs.fuel_type ?? "");
  const bodyType = String(attrs.body_type ?? "sedan");
  const fuelColor = FUEL_COLORS[fuelType] ?? FUEL_COLORS.GASOLINE;

  // Ort. puanlar
  const agg = await prisma.review.aggregate({
    where: { productId: product.id, status: "PUBLISHED" },
    _avg: {
      scoreFiyat: true,
      scoreKalite: true,
      scorePerformans: true,
      scoreOverall: true,
    },
    _count: { id: true },
  });

  const reviewCount = agg._count.id;
  const scores: FikapeScores | null =
    reviewCount > 0
      ? {
          scoreFiyat:      agg._avg.scoreFiyat      ?? 0,
          scoreKalite:     agg._avg.scoreKalite     ?? 0,
          scorePerformans: agg._avg.scorePerformans ?? 0,
          scoreOverall:    agg._avg.scoreOverall    ?? 0,
        }
      : null;

  // Yorumlar
  const reviews = await prisma.review.findMany({
    where: { productId: product.id, status: "PUBLISHED" },
    include: {
      user: { select: { displayName: true, trustLevel: true } },
    },
    orderBy: { publishedAt: "desc" },
    take: 20,
  });

  // Özellik satırları
  const specs: { label: string; value: string }[] = [
    { label: "Yakıt",    value: FUEL_LABELS[fuelType] ?? fuelType },
    { label: "Kasa",     value: BODY_LABELS[bodyType] ?? bodyType },
    attrs.segment   ? { label: "Segment",  value: `${attrs.segment} Segment` }          : null,
    attrs.power_hp  ? { label: "Güç",      value: `${attrs.power_hp} HP` }              : null,
    attrs.engine_cc ? { label: "Motor",    value: `${attrs.engine_cc} cc` }             : null,
    attrs.ev_range_km ? { label: "Menzil", value: `${attrs.ev_range_km} km (WLTP)` }   : null,
  ].filter(Boolean) as { label: string; value: string }[];

  return (
    <>
      {/* Hero başlık */}
      <div
        className="w-full relative"
        style={{ background: fuelType === "EV" ? "#0d1117" : "#111" }}
      >
        {/* Arka plan fotoğrafı */}
        {imageUrl && (
          <div className="absolute inset-0 overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt={`${product.brand.name} ${product.model.name}`}
              className="absolute inset-0 w-full h-full object-cover opacity-20"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 to-black/80" />
          </div>
        )}

        <div className="relative max-w-5xl mx-auto px-4 py-10">
          {/* Geri */}
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-400 hover:text-gray-200 mb-6 transition-colors"
          >
            ← Tüm araçlar
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-end gap-6">
            {/* İkon */}
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl shrink-0 overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {imageUrl
                ? <img src={imageUrl} alt="" className="object-cover w-full h-full" />
                : BODY_ICONS[bodyType] ?? "🚗"
              }
            </div>

            {/* İsim + rozetler */}
            <div className="flex-1">
              <div className="text-sm font-semibold text-gray-400 mb-1 tracking-wide uppercase">
                {product.brand.name}
              </div>
              <h1 className="text-3xl font-black text-white tracking-tight">
                {product.model.name}
                {product.year && <span className="text-gray-400 font-light ml-2">{product.year}</span>}
              </h1>
              <div className="flex flex-wrap gap-2 mt-3">
                <span
                  className="text-xs font-semibold px-2.5 py-1 rounded-full"
                  style={{ background: fuelColor.bg, color: fuelColor.text }}
                >
                  {FUEL_ICONS[fuelType] && `${FUEL_ICONS[fuelType]} `}{FUEL_LABELS[fuelType] ?? fuelType}
                </span>
                <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-white/10 text-gray-300">
                  {BODY_LABELS[bodyType] ?? bodyType}
                </span>
                {attrs.segment != null && (
                  <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-white/10 text-gray-300">
                    {String(attrs.segment)} Segment
                  </span>
                )}
              </div>
            </div>

            {/* Genel skor */}
            {scores && (
              <div className="text-right">
                <div className="text-5xl font-black text-white">
                  {calcOverall(scores).toFixed(1)}
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  {reviewCount} yorumun ortalaması
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Yorum gönderildi banner */}
      {yorum === "gonderildi" && (
        <div className="bg-green-50 border-b border-green-100">
          <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
            <span className="text-green-600 text-lg">✓</span>
            <p className="text-sm font-semibold text-green-800">
              Yorumunuz alındı — inceleme sonrası yayınlanacak.
            </p>
          </div>
        </div>
      )}

      {/* Ana içerik */}
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* SOL — yorumlar */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-base font-bold text-gray-900">
              {reviewCount > 0 ? `${reviewCount} Kullanıcı Yorumu` : "Henüz yorum yok"}
            </h2>

            {reviews.length === 0 ? (
              <div className="bg-white border-2 border-dashed border-gray-100 rounded-2xl p-10 text-center space-y-3">
                <div className="text-3xl">✍️</div>
                <p className="font-semibold text-gray-800">Bu araç için ilk yorumu sen yaz</p>
                <p className="text-sm text-gray-400">
                  Gerçek deneyimini paylaş, diğer kullanıcılara yol göster.
                </p>
                <Link
                  href={`/yorum-yaz?arac=${slug}`}
                  className="inline-block mt-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-colors"
                  style={{ background: "#111" }}
                >
                  Yorum Yaz →
                </Link>
              </div>
            ) : (
              reviews.map((r) => (
                <ReviewCard
                  key={r.id}
                  displayName={r.user.displayName}
                  trustLevel={r.user.trustLevel}
                  ownershipMonths={r.ownershipMonthsAtReview}
                  scoreFiyat={r.scoreFiyat}
                  scoreKalite={r.scoreKalite}
                  scorePerformans={r.scorePerformans}
                  summaryText={r.summaryText}
                  detailText={r.detailText}
                  wouldBuyAgain={r.wouldBuyAgain}
                  createdAt={r.createdAt}
                />
              ))
            )}
          </div>

          {/* SAĞ — skor + özellikler (sticky) */}
          <div className="space-y-4">
            <div className="sticky top-28 space-y-4">

              {/* FI·KA·PE bars */}
              <div className="bg-white border border-gray-100 rounded-2xl p-5">
                {scores ? (
                  <FikapeScore scores={scores} variant="bars" reviewCount={reviewCount} />
                ) : (
                  <div className="text-sm text-gray-400 text-center py-4">
                    Puanlar yorumlarla oluşur
                  </div>
                )}

                <Link
                  href={`/yorum-yaz?arac=${slug}`}
                  className="mt-4 w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold text-white transition-colors"
                  style={{ background: "#111" }}
                >
                  Yorum Yaz →
                </Link>
              </div>

              {/* Teknik özellikler */}
              <div className="bg-white border border-gray-100 rounded-2xl p-5">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                  Teknik Özellikler
                </h3>
                <dl className="space-y-2.5">
                  {specs.map(({ label, value }) => (
                    <div key={label} className="flex justify-between items-baseline text-sm">
                      <dt className="text-gray-400">{label}</dt>
                      <dd className="font-semibold text-gray-800">{value}</dd>
                    </div>
                  ))}
                </dl>
              </div>

            </div>
          </div>

        </div>
      </div>
    </>
  );
}
