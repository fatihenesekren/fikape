import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { sellVehicleSchema, formatZodError } from "@/lib/schemas";

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
        data: {
          ownershipStatus: "CURRENT",
          soldAt: null,
          soldReason: [],
          soldReasonNote: null,
          saleType: null,
          salePrice: null,
          tradeExtraDirection: null,
          tradeExtraAmount: null,
        },
      });
      return NextResponse.json({ ok: true, reactivated: true });
    }
    return NextResponse.json({ error: "Zaten garajında" }, { status: 409 });
  }

  const userProduct = await prisma.userProduct.create({
    data: { userId, productId },
  });

  // Kullanıcı bu araç için önce yorum yazmış, sonra garajına eklemiş olabilir —
  // o zaman review.userProductId hâlâ null'dı (yorum yazılırken garaj kaydı yoktu).
  // Şimdi garaj kaydı oluştuğuna göre, o yorum(lar)ı geriye dönük bağla.
  await prisma.review.updateMany({
    where: { userId, productId, userProductId: null },
    data: { userProductId: userProduct.id },
  });

  return NextResponse.json({ ok: true, id: userProduct.id });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Giriş gerekli" }, { status: 401 });
  }

  const body = await req.json();
  const { productId, action } = body;
  const userId = Number(session.user.id);

  if (action === "sell") {
    const parsed = sellVehicleSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 });
    }
    const { soldReason, soldReasonNote, soldMonth, saleType, salePrice, tradeExtraDirection, tradeExtraAmount } = parsed.data;

    const userProduct = await prisma.userProduct.findUnique({
      where: { userId_productId: { userId, productId } },
    });
    if (!userProduct) {
      return NextResponse.json({ error: "Garajında değil" }, { status: 404 });
    }

    let soldAt = new Date();
    if (soldMonth) {
      const [y, m] = soldMonth.split("-").map(Number);
      soldAt = new Date(y, m - 1, 1);
      if (soldAt < userProduct.createdAt) soldAt = userProduct.createdAt;
      if (soldAt > new Date()) soldAt = new Date();
    }

    await prisma.$transaction([
      prisma.userProduct.update({
        where: { userId_productId: { userId, productId } },
        data: {
          ownershipStatus: "PAST",
          soldAt,
          soldReason,
          soldReasonNote: soldReason.includes("OTHER") ? (soldReasonNote?.trim() || null) : null,
          saleType,
          salePrice: salePrice ?? null,
          tradeExtraDirection: saleType === "TRADE" ? (tradeExtraDirection ?? null) : null,
          tradeExtraAmount: saleType === "TRADE" ? (tradeExtraAmount ?? null) : null,
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
      data: {
        ownershipStatus: "CURRENT",
        soldAt: null,
        soldReason: [],
        soldReasonNote: null,
        saleType: null,
        salePrice: null,
        tradeExtraDirection: null,
        tradeExtraAmount: null,
      },
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
