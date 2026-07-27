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

  await prisma.favorite.upsert({
    where: { userId_productId: { userId, productId } },
    update: {},
    create: { userId, productId },
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Giriş gerekli" }, { status: 401 });
  }

  const { productId } = await req.json();
  if (!productId) {
    return NextResponse.json({ error: "productId gerekli" }, { status: 400 });
  }

  const userId = Number(session.user.id);

  await prisma.favorite.deleteMany({
    where: { userId, productId },
  });

  return NextResponse.json({ ok: true });
}
