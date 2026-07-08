import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendReminderEmail, sendUpdateReminderEmail } from "@/lib/email";
import { stripModelGenRange } from "@/lib/modelDisplay";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? process.env.AUTH_URL ?? "https://fikape-e4t7.vercel.app";

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const from = new Date(now.getTime() - 91 * 24 * 60 * 60 * 1000);
  const to   = new Date(now.getTime() - 84 * 24 * 60 * 60 * 1000);

  // Garajına araç ekleyeli 84-91 gün olan kullanıcılar
  const candidates = await prisma.userProduct.findMany({
    where: {
      ownershipStatus: "CURRENT",
      createdAt: { gte: from, lte: to },
      user: {
        isBanned: false,
        emailVerifiedAt: { not: null },
      },
    },
    include: {
      user: { select: { id: true, email: true, displayName: true } },
      product: {
        select: {
          slug: true,
          brand: { select: { name: true } },
          model: { select: { name: true } },
        },
      },
    },
  });

  if (candidates.length === 0) {
    return NextResponse.json({ ok: true, sent: 0, skipped: 0 });
  }

  // Mevcut yorumları çek (PUBLISHED)
  const pairs = candidates.map((c) => ({ userId: c.userId, productId: c.productId }));
  const existingReviews = await prisma.review.findMany({
    where: {
      OR: pairs.map((p) => ({ userId: p.userId, productId: p.productId })),
      status: "PUBLISHED",
    },
    select: { id: true, userId: true, productId: true },
  });

  const reviewMap = new Map(
    existingReviews.map((r) => [`${r.userId}-${r.productId}`, r.id])
  );

  let sent = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const c of candidates) {
    const key = `${c.userId}-${c.productId}`;
    const vehicleName = `${c.product.brand.name} ${stripModelGenRange(c.product.model.name)}`;
    const existingReviewId = reviewMap.get(key);

    try {
      if (existingReviewId) {
        // Zaten yorum yazmış → güncelleme hatırlatması
        const updateUrl = `${BASE_URL}/yorumum/${existingReviewId}/guncelle`;
        await sendUpdateReminderEmail({
          to:          c.user.email,
          displayName: c.user.displayName,
          vehicleName,
          updateUrl,
        });
      } else {
        // İlk yorum hatırlatması
        await sendReminderEmail({
          to:          c.user.email,
          displayName: c.user.displayName,
          vehicleName,
          productSlug: c.product.slug,
        });
      }
      sent++;
    } catch (err) {
      errors.push(`${c.user.email}: ${String(err)}`);
      skipped++;
    }
  }

  return NextResponse.json({
    ok: true,
    sent,
    skipped,
    errors: errors.length ? errors : undefined,
    ranAt: now.toISOString(),
  });
}
