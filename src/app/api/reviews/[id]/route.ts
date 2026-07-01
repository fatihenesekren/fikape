import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { validateDetailShort } from "@/lib/reviewValidation";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Giriş gerekli." }, { status: 401 });
  }

  const { id } = await params;
  const reviewId = parseInt(id);
  const userId = parseInt(session.user.id);

  const { pros, cons, detailText, wouldBuyAgain } = await req.json();

  const prosArr: string[] = Array.isArray(pros) ? pros : [];
  const consArr: string[] = Array.isArray(cons) ? cons : [];
  if (prosArr.length < 1 || prosArr.length > 3) {
    return NextResponse.json({ error: "En az 1, en fazla 3 artı seçin." }, { status: 400 });
  }
  if (consArr.length < 1 || consArr.length > 3) {
    return NextResponse.json({ error: "En az 1, en fazla 3 eksi seçin." }, { status: 400 });
  }

  const detailCheck = validateDetailShort(detailText ?? "");
  if (!detailCheck.ok) {
    return NextResponse.json({ error: detailCheck.error }, { status: 400 });
  }

  const review = await prisma.review.findUnique({
    where: { id: reviewId },
    select: { userId: true, status: true, extendedData: true, editCount: true },
  });

  if (!review) return NextResponse.json({ error: "Yorum bulunamadı." }, { status: 404 });
  if (review.userId !== userId) return NextResponse.json({ error: "Yetkisiz." }, { status: 403 });
  if (review.status !== "PUBLISHED") {
    return NextResponse.json({ error: "Yalnızca yayındaki yorumlar düzenlenebilir." }, { status: 409 });
  }

  const existing = (review.extendedData as Record<string, unknown>) ?? {};
  const updatedExtended = { ...existing, pros: prosArr, cons: consArr };

  await prisma.review.update({
    where: { id: reviewId },
    data: {
      extendedData: updatedExtended,
      detailText:   detailText?.trim() || null,
      wouldBuyAgain: wouldBuyAgain ?? null,
      editedAt:     new Date(),
      editCount:    review.editCount + 1,
    },
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Giriş gerekli." }, { status: 401 });
  }

  const { id } = await params;
  const reviewId = parseInt(id);
  const userId = parseInt(session.user.id);

  const review = await prisma.review.findUnique({
    where: { id: reviewId },
    select: { userId: true, status: true },
  });

  if (!review) return NextResponse.json({ error: "Yorum bulunamadı." }, { status: 404 });
  if (review.userId !== userId) return NextResponse.json({ error: "Yetkisiz." }, { status: 403 });
  if (review.status === "DELETED") return NextResponse.json({ ok: true });

  await prisma.review.update({
    where: { id: reviewId },
    data: { status: "DELETED" },
  });

  return NextResponse.json({ ok: true });
}
