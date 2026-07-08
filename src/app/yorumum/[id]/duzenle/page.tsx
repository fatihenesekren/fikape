import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getChipsForCategory } from "@/lib/chips";
import { EditReviewForm } from "./EditReviewForm";
import { stripModelGenRange } from "@/lib/modelDisplay";

export const metadata = { title: "Yorumu Düzenle — fikape" };

export default async function EditReviewPage({
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
      scoreFiyat: true,
      scoreKalite: true,
      scorePerformans: true,
      product: {
        select: {
          slug: true,
          name: true,
          brand: { select: { name: true } },
          model: { select: { name: true } },
          category: { select: { slug: true } },
        },
      },
    },
  });

  if (!review) notFound();
  if (review.userId !== userId) notFound();
  if (review.status !== "PUBLISHED" && review.status !== "PENDING") redirect("/profil");

  const ext = (review.extendedData as Record<string, unknown>) ?? {};
  const initialPros = (ext.pros as string[] | undefined) ?? [];
  const initialCons = (ext.cons as string[] | undefined) ?? [];
  const chips = getChipsForCategory(review.product.category.slug);

  const vehicleName = `${review.product.brand.name} ${stripModelGenRange(review.product.model.name)}`;

  return (
    <div className="max-w-xl mx-auto px-4 py-10 space-y-6">
      <div>
        <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold mb-1">
          Yorumu Düzenle
        </p>
        <h1 className="text-2xl font-black text-gray-900">{vehicleName}</h1>
        <p className="text-sm text-gray-400 mt-1">
          Puanları, artı/eksileri ve metni güncelleyebilirsin.
        </p>
        {review.status === "PENDING" && (
          <p className="text-xs mt-3 px-3 py-2 rounded-lg bg-amber-50 text-amber-800 border border-amber-100">
            Bu yorum henüz incelemede — yayınlanmadan önce de düzenleyebilirsin.
          </p>
        )}
      </div>

      <EditReviewForm
        reviewId={reviewId}
        productSlug={review.product.slug}
        reviewStatus={review.status}
        chips={chips}
        initialPros={initialPros}
        initialCons={initialCons}
        initialDetailText={review.detailText ?? ""}
        initialWouldBuyAgain={review.wouldBuyAgain}
        initialScoreFiyat={review.scoreFiyat}
        initialScoreKalite={review.scoreKalite}
        initialScorePerformans={review.scorePerformans}
      />
    </div>
  );
}
