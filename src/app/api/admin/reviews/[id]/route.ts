import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || (session.user.trustLevel as number) < 5) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 403 });
  }

  const { id } = await params;
  const reviewId = parseInt(id);
  const { action, reason } = await req.json() as { action: "approve" | "reject"; reason?: string };

  if (action === "approve") {
    await prisma.review.update({
      where: { id: reviewId },
      data: { status: "PUBLISHED", publishedAt: new Date() },
    });
    return NextResponse.json({ ok: true, status: "PUBLISHED" });
  }

  if (action === "reject") {
    await prisma.review.update({
      where: { id: reviewId },
      data: { status: "REJECTED", rejectedAt: new Date(), rejectionReason: reason ?? null },
    });
    return NextResponse.json({ ok: true, status: "REJECTED" });
  }

  return NextResponse.json({ error: "Geçersiz işlem." }, { status: 400 });
}
