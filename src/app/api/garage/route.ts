import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Giriş gerekli" }, { status: 401 });
  }

  const { productId } = await req.json();
  if (!productId) {
    return NextResponse.json({ error: "productId gerekli" }, { status: 400 });
  }

  const userId = Number(session.user.id);

  const existing = await prisma.userProduct.findUnique({
    where: { userId_productId: { userId, productId } },
  });

  if (existing) {
    if (existing.ownershipStatus === "PAST") {
      // Sold vehicle → reactivate instead of error
      await prisma.userProduct.update({
        where: { userId_productId: { userId, productId } },
        data: { ownershipStatus: "CURRENT", soldAt: null, soldReason: null },
      });
      return NextResponse.json({ ok: true, reactivated: true });
    }
    return NextResponse.json({ error: "Zaten garajında" }, { status: 409 });
  }

  const userProduct = await prisma.userProduct.create({
    data: { userId, productId },
  });

  return NextResponse.json({ ok: true, id: userProduct.id });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Giriş gerekli" }, { status: 401 });
  }

  const { productId, action, soldReason, soldMonthsAgo } = await req.json();
  const userId = Number(session.user.id);

  if (action === "sell") {
    const userProduct = await prisma.userProduct.findUnique({
      where: { userId_productId: { userId, productId } },
    });
    if (!userProduct) {
      return NextResponse.json({ error: "Garajında değil" }, { status: 404 });
    }

    let soldAt = new Date();
    if (typeof soldMonthsAgo === "number" && soldMonthsAgo > 0) {
      soldAt.setMonth(soldAt.getMonth() - soldMonthsAgo);
      if (soldAt < userProduct.createdAt) soldAt = userProduct.createdAt;
    }

    await prisma.$transaction([
      prisma.userProduct.update({
        where: { userId_productId: { userId, productId } },
        data: {
          ownershipStatus: "PAST",
          soldAt,
          soldReason: soldReason ?? null,
        },
      }),
      prisma.tradeListing.updateMany({
        where: { userProductId: userProduct.id, isActive: true },
        data: { isActive: false, closedAt: new Date() },
      }),
    ]);
  } else if (action === "reactivate") {
    await prisma.userProduct.update({
      where: { userId_productId: { userId, productId } },
      data: { ownershipStatus: "CURRENT", soldAt: null, soldReason: null },
    });
  } else {
    return NextResponse.json({ error: "Geçersiz action" }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Giriş gerekli" }, { status: 401 });
  }

  const { productId } = await req.json();
  const userId = Number(session.user.id);

  const userProduct = await prisma.userProduct.findUnique({
    where: { userId_productId: { userId, productId } },
    select: { id: true },
  });

  if (userProduct) {
    const pendingReport = await prisma.messageReport.findFirst({
      where: {
        status: "PENDING",
        message: { thread: { tradeListing: { userProductId: userProduct.id } } },
      },
    });
    if (pendingReport) {
      return NextResponse.json(
        { error: "Bu araç şu an incelemede, takasa açılamıyor." },
        { status: 409 }
      );
    }
  }

  await prisma.userProduct.deleteMany({
    where: { userId, productId },
  });

  return NextResponse.json({ ok: true });
}
