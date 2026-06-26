import { prisma } from "@/lib/prisma";
import { ModerationClient } from "./ModerationClient";

export const metadata = { title: "Moderasyon — fikape admin" };

export default async function ModerationPage() {
  const reviews = await prisma.review.findMany({
    where: { status: "PENDING" },
    select: {
      id: true,
      summaryText: true,
      detailText: true,
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
    },
    orderBy: { createdAt: "asc" },
  });

  const serialized = reviews.map((r) => ({
    ...r,
    createdAt: r.createdAt.toISOString(),
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
      </div>
      <ModerationClient initialReviews={serialized} />
    </div>
  );
}
