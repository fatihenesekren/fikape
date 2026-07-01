import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getChipsForCategory } from "@/lib/chips";
import { EditReviewForm } from "./EditReviewForm";

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
  if (review.status !== "PUBLISHED") redirect("/profil");

  const ext = (review.extendedData as Record<string, unknown>) ?? {};
  const initialPros = (ext.pros as string[] | undefined) ?? [];
  const initialCons = (ext.cons as string[] | undefined) ?? [];
  const chips = getChipsForCategory(review.product.category.slug);

  const vehicleName = `${review.product.brand.name} ${review.product.model.name}`;

  return (
    <div className="max-w-xl mx-auto px-4 py-10 space-y-6">
      <div>
        <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold mb-1">
          Yorumu Düzenle
        </p>
        <h1 className="text-2xl font-black text-gray-900">{vehicleName}</h1>
        <p className="text-sm text-gray-400 mt-1">
          Puanlar değişmez — sadece artılar/eksiler ve metin güncellenebilir.
        </p>
      </div>

      <EditReviewForm
        reviewId={reviewId}
        productSlug={review.product.slug}
        chips={chips}
        initialPros={initialPros}
        initialCons={initialCons}
        initialDetailText={review.detailText ?? ""}
        initialWouldBuyAgain={review.wouldBuyAgain}
      />
    </div>
  );
}
