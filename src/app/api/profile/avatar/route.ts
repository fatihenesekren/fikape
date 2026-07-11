import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { buildAvatarOptionSeeds, dicebearUrl } from "@/lib/avatar";

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Giriş gerekli" }, { status: 401 });
  }

  const userId = Number(session.user.id);
  const { seed } = await req.json();

  // seed=null: baş harflere dön (avatarUrl temizlenir)
  if (seed === null) {
    await prisma.user.update({ where: { id: userId }, data: { avatarUrl: null } });
    return NextResponse.json({ avatarUrl: null });
  }

  // Sadece bu kullanıcı için üretilen sabit seçeneklerden biri kabul edilir —
  // rastgele bir URL/seed enjekte edilmesini engeller.
  const allowedSeeds = buildAvatarOptionSeeds(userId);
  if (typeof seed !== "string" || !allowedSeeds.includes(seed)) {
    return NextResponse.json({ error: "Geçersiz avatar seçimi" }, { status: 400 });
  }

  const avatarUrl = dicebearUrl(seed);
  await prisma.user.update({ where: { id: userId }, data: { avatarUrl } });

  return NextResponse.json({ avatarUrl });
}
