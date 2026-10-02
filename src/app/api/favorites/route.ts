import { kullaniciLimiti } from "@/lib/userRateLimit";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { pozitifTamsayiId } from "@/lib/validateId";

export async function POST(req: NextRequest) {
  const session = await auth();
  const limitYaniti = await kullaniciLimiti(session, "favorites", 120, 60 * 60 * 1000);
  if (limitYaniti) return limitYaniti;
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Giriş gerekli" }, { status: 401 });
  }

  const govde = (await req.json().catch(() => null)) ?? {};
  if (!govde.productId) {
    return NextResponse.json({ error: "productId gerekli" }, { status: 400 });
  }
  const productId = pozitifTamsayiId(govde.productId);
  if (productId === null) return NextResponse.json({ error: "Geçersiz productId" }, { status: 400 });

  const userId = Number(session.user.id);

  // Var olmayan ürün FK hatasıyla 500 vermesin
  const urun = await prisma.product.findUnique({ where: { id: productId }, select: { id: true, status: true, isActive: true } });
  if (!urun) return NextResponse.json({ error: "Araç bulunamadı" }, { status: 404 });
  if (urun.status !== "ACTIVE" || !urun.isActive) {
    return NextResponse.json({ error: "Bu araç şu an katalogda değil" }, { status: 409 });
  }

  await prisma.favorite.upsert({
    where: { userId_productId: { userId, productId } },
    update: {},
    create: { userId, productId },
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  const limitYaniti = await kullaniciLimiti(session, "favorites", 120, 60 * 60 * 1000);
  if (limitYaniti) return limitYaniti;
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Giriş gerekli" }, { status: 401 });
  }

  const govde = (await req.json().catch(() => null)) ?? {};
  if (!govde.productId) {
    return NextResponse.json({ error: "productId gerekli" }, { status: 400 });
  }
  const productId = pozitifTamsayiId(govde.productId);
  if (productId === null) return NextResponse.json({ error: "Geçersiz productId" }, { status: 400 });

  const userId = Number(session.user.id);

  await prisma.favorite.deleteMany({
    where: { userId, productId },
  });

  return NextResponse.json({ ok: true });
}
