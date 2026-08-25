import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { FUEL_LABELS, FUEL_ICONS, FUEL_COLORS } from "@/lib/fuel";
import { FikapeScore } from "@/components/FikapeScore";
import { formatSoldReasons } from "@/lib/soldReasons";
import { GarageAnimation } from "./GarageAnimation";
import { InsuranceLeadCard } from "./InsuranceLeadCard";
import { TradeToggleCard } from "./TradeToggleCard";
import type { PartCondition } from "@/lib/carParts";
import { stripModelGenRange, stripGenRangeAnywhere } from "@/lib/modelDisplay";

export const metadata: Metadata = { title: "Garajım" };

const BODY_LABELS: Record<string, string> = {
  sedan: "Sedan", suv: "SUV", hatchback: "Hatchback",
  mpv: "MPV", coupe: "Coupe", cabrio: "Cabriolet",
};

export default async function GarajimPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/giris");

  const userId = Number(session.user.id);

  const currentUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { displayName: true, email: true },
  });

  const userName = currentUser?.displayName || currentUser?.email?.split("@")[0] || "Sürücü";

  // Takasa açabilmek için trustLevel (genel/kullanıcı-bazlı) yeterli değil —
  // her ARAÇ için ayrı ayrı, o araca bağlı fotoğraflı+onaylı bir yorum var mı bakılır.
  const verifiedReviews = await prisma.review.findMany({
    where: { userId, status: "PUBLISHED", photos: { some: { status: "APPROVED" } } },
    select: { userProductId: true },
  }).catch(() => []);
  const verifiedUserProductIds = new Set(
    verifiedReviews.map((r) => r.userProductId).filter((id): id is number => id != null)
  );

  const insuranceLeads = await prisma.insuranceLead.findMany({
    where: { userId },
    select: { productId: true },
  }).catch(() => []); // migration henüz uygulanmadıysa sayfa çökmesin
  const leadProductIds = new Set(insuranceLeads.map((l) => l.productId));

  const [tradeListings, tradeCategories, tradeBrands, categoryBrandLinks] = await Promise.all([
    // Sadece aktif değil, en son (kapalı dahil) ilan da çekiliyor — kapalı bir
    // ilanı "yeniden aç" seçeneği sunabilmek için (bkz. denetim raporu Faz 2).
    prisma.tradeListing.findMany({
      where: { userId },
      select: {
        id: true, userProductId: true, isActive: true, city: true,
        paymentIntent: true, note: true, description: true, wantAnything: true,
        wantCategoryId: true, wantBrandId: true,
        partConditions: { select: { partKey: true, condition: true } },
        damageStatus: true,
        engineCondition: true, engineNote: true,
        transmissionCondition: true, transmissionNote: true,
        runningGearCondition: true, runningGearNote: true,
        tramerRecords: { select: { month: true, year: true, amount: true }, orderBy: [{ year: "desc" }, { month: "desc" }] },
      },
      orderBy: { createdAt: "desc" },
    }).catch(() => []),
    // Sadece yaprak kategoriler (üst kategori "Araçlar" hariç)
    prisma.category.findMany({ where: { isActive: true, parentId: { not: null } }, select: { id: true, name: true }, orderBy: { sortOrder: "asc" } }).catch(() => []),
    prisma.brand.findMany({ where: { isActive: true }, select: { id: true, name: true }, orderBy: { name: "asc" } }).catch(() => []),
    prisma.product.findMany({ where: { isActive: true }, select: { categoryId: true, brandId: true }, distinct: ["categoryId", "brandId"] }).catch(() => []),
  ]);
  // tradeListings createdAt desc sıralı — her userProductId için İLK karşılaşılan
  // (yani en yeni) kayıt tutulmalı; new Map(array) tam tersini yapıp SON kaydı
  // tutar, bu yüzden manuel olarak sadece henüz map'te olmayan anahtarlar ekleniyor.
  const tradeListingByUserProductId = new Map<number, Omit<(typeof tradeListings)[number], "partConditions"> & { partConditions: Record<string, PartCondition> }>();
  for (const t of tradeListings) {
    if (!tradeListingByUserProductId.has(t.userProductId)) {
      const { partConditions: rawPartConditions, ...rest } = t;
      const partConditionsMap: Record<string, PartCondition> = Object.fromEntries(
        rawPartConditions.map((p) => [p.partKey, p.condition as PartCondition])
      );
      tradeListingByUserProductId.set(t.userProductId, { ...rest, partConditions: partConditionsMap });
    }
  }
  const categoryBrandMap: Record<number, number[]> = {};
  for (const link of categoryBrandLinks) {
    (categoryBrandMap[link.categoryId] ??= []).push(link.brandId);
  }

  const userProducts = await prisma.userProduct.findMany({
    where: { userId },
    include: {
      product: {
        include: { brand: true, model: true, category: { select: { slug: true } } },
      },
      reviews: {
        where: { status: "PUBLISHED" },
        orderBy: { publishedAt: "desc" },
        take: 1,
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const activeVehicles = userProducts.filter((up) => up.ownershipStatus === "CURRENT");
  const soldVehicles   = userProducts.filter((up) => up.ownershipStatus === "PAST");

  function VehicleCard({
    product, reviews, soldReason, soldReasonNote, soldAt, isSold, userProductId,
  }: {
    product: (typeof userProducts)[0]["product"];
    reviews: (typeof userProducts)[0]["reviews"];
    soldReason?: string[] | null;
    soldReasonNote?: string | null;
    soldAt?: Date | null;
    isSold?: boolean;
    userProductId: number;
  }) {
    const attrs = product.attributes as Record<string, unknown>;
    const fuelType = String(attrs.fuel_type ?? "");
    const bodyType = String(attrs.body_type ?? "sedan");
    const fuelColor = FUEL_COLORS[fuelType] ?? FUEL_COLORS.GASOLINE;
    const review = reviews[0] ?? null;

    return (
      <div
        className="bg-white border border-gray-100 rounded-2xl overflow-hidden"
        style={isSold ? { opacity: 0.75 } : undefined}
      >
        {/* Araç fotoğrafı — sitenin geri kalanındaki VehicleCard'la aynı görsel
            dil (geniş banner + gradyan + yakıt rozeti): önceden küçük bir kare
            thumbnail olarak yan sütundaydı, bu hem görsel olarak zayıf duruyordu
            hem de mobilde bilgi sütununu sıkıştırıp taşmaya yol açıyordu
            (bkz. kullanıcı geri bildirimi). */}
        <div
          className="relative w-full h-36 sm:h-40 flex items-center justify-center overflow-hidden"
          style={{ background: fuelType === "EV" ? "#0f2027" : "#1a1a2e" }}
        >
          {product.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.imageUrl}
              alt={stripGenRangeAnywhere(product.name)}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-5xl opacity-20 select-none">🚗</span>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
          {fuelType && (
            <span
              className="absolute top-3 left-3 text-xs font-semibold px-2 py-0.5 rounded-full"
              style={{ background: fuelColor.bg, color: fuelColor.text }}
            >
              {FUEL_ICONS[fuelType]} {FUEL_LABELS[fuelType] ?? fuelType}
            </span>
          )}
          <Link
            href={`/araclar/${product.slug}`}
            className="absolute top-3 right-3 text-xs font-semibold px-2.5 py-1 rounded-full bg-white/90 text-gray-700 hover:bg-white transition-colors"
          >
            Sayfaya git →
          </Link>
        </div>

        <div className="p-4 sm:p-5">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
            {product.brand.name}
          </div>
          <div className="font-bold text-gray-900 text-base">
            {stripModelGenRange(product.model.name)}
            {product.year && (
              <span className="text-gray-400 font-normal ml-1.5">{product.year}</span>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5 mt-2">
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
              {BODY_LABELS[bodyType] ?? bodyType}
            </span>
            {isSold && soldReason && soldReason.length > 0 && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                style={{ background: "#f3f4f6", color: "#6b7280" }}>
                Satıldı · {formatSoldReasons(soldReason, soldReasonNote)}
              </span>
            )}
          </div>

          {/* Yorum durumu — puan varsa sitenin diğer kartlarındaki gibi
              FI·KA·PE çipleriyle gösteriliyor, yoksa dashed CTA kutusu. */}
          {!isSold && (
            <div className="mt-3">
              {review ? (
                <FikapeScore scores={review} variant="chips" />
              ) : (
                <Link
                  href={`/yorum-yaz?arac=${product.slug}`}
                  className="flex items-center justify-center h-11 rounded-xl border-2 border-dashed border-gray-100 text-sm font-semibold text-gray-500 hover:border-gray-200 hover:text-gray-800 transition-colors"
                >
                  Yorum yaz →
                </Link>
              )}
            </div>
          )}

          {isSold && soldAt && (
            <p className="text-xs text-gray-400 mt-2">
              {soldAt.toLocaleDateString("tr-TR", { month: "long", year: "numeric" })} tarihinde satıldı
            </p>
          )}

          {!isSold && (
            <InsuranceLeadCard
              productId={product.id}
              vehicleName={`${product.brand.name} ${stripModelGenRange(product.model.name)}`}
              defaultFullName={currentUser?.displayName ?? ""}
              alreadySubmitted={leadProductIds.has(product.id)}
            />
          )}

          {!isSold && (
            <TradeToggleCard
              userProductId={userProductId}
              canOpenTrade={verifiedUserProductIds.has(userProductId)}
              categories={tradeCategories}
              brands={tradeBrands}
              categoryBrandMap={categoryBrandMap}
              existingListing={tradeListingByUserProductId.get(userProductId) ?? null}
              productSlug={product.slug}
              categorySlug={product.category?.slug ?? ""}
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl w-full mx-auto px-4 py-10">
      <GarageAnimation userName={userName} />

      <div className="mb-8">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-2xl font-black text-gray-900">Garajım</h1>
            <p className="text-sm text-gray-500 mt-1">
              Sahip olduğun veya kullandığın araçlar
            </p>
          </div>
          <Link
            href="/takas"
            className="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold border-2 border-indigo-100 text-indigo-700 hover:border-indigo-200 transition-colors"
          >
            🔄 Takas Pazarına Gözat
          </Link>
        </div>
      </div>

      {/* Aktif araçlar */}
      {activeVehicles.length === 0 && soldVehicles.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-gray-100 rounded-2xl p-12 text-center space-y-3">
          <div className="text-4xl">🚗</div>
          <p className="font-semibold text-gray-800">Henüz araç eklemedin</p>
          <p className="text-sm text-gray-400">
            Araç sayfasında &quot;Bu araç benim&quot; butonuna tıklayarak garajına ekleyebilirsin.
          </p>
          <Link
            href="/"
            className="inline-block mt-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
            style={{ background: "#111" }}
          >
            Araçları gör →
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Aktif */}
          {activeVehicles.length > 0 && (
            <div className="space-y-4">
              {soldVehicles.length > 0 && (
                <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider">
                  Garajımdaki Araçlar
                </h2>
              )}
              {activeVehicles.map(({ id, product, reviews }) => (
                <VehicleCard key={product.id} product={product} reviews={reviews} userProductId={id} />
              ))}
            </div>
          )}

          {/* Geçmiş */}
          {soldVehicles.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider">
                Geçmiş Araçlarım
              </h2>
              {soldVehicles.map(({ id, product, reviews, soldReason, soldReasonNote, soldAt }) => (
                <VehicleCard
                  key={product.id}
                  product={product}
                  reviews={reviews}
                  soldReason={soldReason}
                  soldReasonNote={soldReasonNote}
                  soldAt={soldAt}
                  isSold
                  userProductId={id}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
