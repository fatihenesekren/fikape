import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { sendReviewHelpfulEmail } from "@/lib/email";
import { stripGenRangeAnywhere } from "@/lib/modelDisplay";

const bodySchema = z.object({ isHelpful: z.boolean() });

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Giriş gerekli." }, { status: 401 });

  const { id } = await params;
  const reviewId = parseInt(id);
  if (isNaN(reviewId)) return NextResponse.json({ error: "Geçersiz yorum." }, { status: 400 });

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  const { isHelpful } = parsed.data;

  const userId = parseInt(session.user.id);

  const review = await prisma.review.findUnique({
    where: { id: reviewId },
    select: {
      status: true,
      userId: true,
      product: { select: { name: true } },
      user: { select: { email: true, displayName: true } },
    },
  });
  if (!review || review.status !== "PUBLISHED") {
    return NextResponse.json({ error: "Yorum bulunamadı." }, { status: 404 });
  }
  if (review.userId === userId) {
    return NextResponse.json({ error: "Kendi yorumuna oy veremezsin." }, { status: 403 });
  }

  const priorHelpfulCount = await prisma.reviewHelpfulVote.count({
    where: { reviewId, isHelpful: true },
  });

  await prisma.reviewHelpfulVote.upsert({
    where: { reviewId_userId: { reviewId, userId } },
    create: { reviewId, userId, isHelpful },
    update: { isHelpful },
  });

  // İlk "faydalı" oyu yorum sahibine bildirim gönderir — her oyda spam olmasın diye sadece ilk kez
  if (isHelpful && priorHelpfulCount === 0 && review.userId !== userId) {
    sendReviewHelpfulEmail({
      to: review.user.email,
      displayName: review.user.displayName,
      vehicleName: stripGenRangeAnywhere(review.product.name),
      reviewId,
      userId: review.userId,
    }).catch(() => {});
  }

  const [helpfulCount, notHelpfulCount] = await Promise.all([
    prisma.reviewHelpfulVote.count({ where: { reviewId, isHelpful: true } }),
    prisma.reviewHelpfulVote.count({ where: { reviewId, isHelpful: false } }),
  ]);

  return NextResponse.json({ ok: true, helpfulCount, notHelpfulCount });
}
