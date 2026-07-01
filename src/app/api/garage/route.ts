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

  const { productId, action, soldReason } = await req.json();
  const userId = Number(session.user.id);

  if (action === "sell") {
    await prisma.userProduct.update({
      where: { userId_productId: { userId, productId } },
      data: {
        ownershipStatus: "PAST",
        soldAt: new Date(),
        soldReason: soldReason ?? null,
      },
    });
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

  await prisma.userProduct.deleteMany({
    where: { userId, productId },
  });

  return NextResponse.json({ ok: true });
}
