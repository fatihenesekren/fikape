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
    return NextResponse.json({ error: "Zaten garajında" }, { status: 409 });
  }

  const userProduct = await prisma.userProduct.create({
    data: { userId, productId },
  });

  return NextResponse.json({ ok: true, id: userProduct.id });
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
