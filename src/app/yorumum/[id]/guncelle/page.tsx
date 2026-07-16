import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getChipsForCategory } from "@/lib/chips";
import { UpdateReviewForm } from "./UpdateReviewForm";
import { stripModelGenRange } from "@/lib/modelDisplay";

export const metadata = { title: "Yorumu Güncelle — fikape" };

export default async function UpdateReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/giris");

  const { id } = await params;
  const reviewId = parseInt(id);
  if (isNaN(reviewId)) notFound();

  const userId = parseInt(session.user.id);

  const review = await prisma.review.findUnique({
    where: { id: reviewId },
    select: {
      userId: true,
      status: true,
      detailText: true,
      wouldBuyAgain: true,
      extendedData: true,
      publishedAt: true,
      scoreFiyat: true,
      scoreKalite: true,
      scorePerformans: true,
      ownershipMonthsAtReview: true,
      photos: {
        where: { status: { not: "REJECTED" } },
        orderBy: { order: "asc" },
        select: { id: true, url: true },
      },
      product: {
        select: {
          slug: true,
          attributes: true,
          brand: { select: { name: true } },
          model: { select: { name: true } },
          category: { select: { slug: true } },
        },
      },
    },
  });

  if (!review) notFound();
  if (review.userId !== userId) notFound();
  if (review.status !== "PUBLISHED") redirect("/profil");

  const ext = (review.extendedData as Record<string, unknown>) ?? {};
  const initialPros = (ext.pros as string[] | undefined) ?? [];
  const initialCons = (ext.cons as string[] | undefined) ?? [];
  const chips = getChipsForCategory(review.product.category.slug);

  const attrs = (review.product.attributes as Record<string, unknown>) ?? {};
  const fuelType = (attrs.fuel_type as string | undefined) ?? null;
  const categorySlug = review.product.category.slug;

  const vehicleName = `${review.product.brand.name} ${stripModelGenRange(review.product.model.name)}`;

  const monthsAgo = review.publishedAt
    ? Math.floor((Date.now() - review.publishedAt.getTime()) / (1000 * 60 * 60 * 24 * 30))
    : null;

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 space-y-6">
      <div>
        <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold mb-1">
          Yorumu Güncelle
        </p>
        <h1 className="text-2xl font-black text-gray-900">{vehicleName}</h1>
        <p className="text-sm text-gray-400 mt-1">
          {monthsAgo !== null && monthsAgo > 0
            ? `${monthsAgo} ay önce yazdığın yorum hâlâ geçerli mi?`
            : "Deneyimin değişti mi?"}
        </p>
      </div>

      <UpdateReviewForm
        reviewId={reviewId}
        productSlug={review.product.slug}
        chips={chips}
        fuelType={fuelType}
        categorySlug={categorySlug}
        initialPros={initialPros}
        initialCons={initialCons}
        initialDetailText={review.detailText ?? ""}
        initialWouldBuyAgain={review.wouldBuyAgain}
        initialScoreFiyat={review.scoreFiyat}
        initialScoreKalite={review.scoreKalite}
        initialScorePerformans={review.scorePerformans}
        initialOwnershipMonths={review.ownershipMonthsAtReview}
        initialExtendedData={ext}
        initialPhotos={review.photos}
      />
    </div>
  );
}
