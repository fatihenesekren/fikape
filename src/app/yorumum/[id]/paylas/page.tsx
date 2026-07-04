import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ShareCard } from "./ShareCard";

export const metadata = { title: "Yorumunu Paylaş — fikape" };

export default async function ShareReviewPage({
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
      product: {
        select: {
          slug: true,
          brand: { select: { name: true } },
          model: { select: { name: true } },
        },
      },
    },
  });

  if (!review) notFound();
  if (review.userId !== userId) notFound();
  if (review.status !== "PUBLISHED") redirect("/profil");

  const vehicleName = `${review.product.brand.name} ${review.product.model.name}`;

  return (
    <div className="max-w-md mx-auto px-4 py-10 space-y-6">
      <div>
        <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold mb-1">
          Yorumun Yayında
        </p>
        <h1 className="text-2xl font-black text-gray-900">Kartını Paylaş</h1>
        <p className="text-sm text-gray-500 mt-1">
          {vehicleName} için yazdığın yorum bir story kartına dönüştü — arkadaşlarınla paylaş.
        </p>
      </div>

      <ShareCard reviewId={reviewId} vehicleName={vehicleName} productSlug={review.product.slug} />
    </div>
  );
}
