import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { buildAvatarOptions, dicebearUrl } from "@/lib/avatar";

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Giriş gerekli" }, { status: 401 });
  }

  const userId = Number(session.user.id);
  const { index } = await req.json();

  // index=null: baş harflere dön (avatarUrl temizlenir)
  if (index === null) {
    await prisma.user.update({ where: { id: userId }, data: { avatarUrl: null } });
    return NextResponse.json({ avatarUrl: null });
  }

  // Sadece bu kullanıcı için üretilen sabit seçeneklerden biri kabul edilir —
  // rastgele bir stil/seed enjekte edilmesini engeller, seçim server'da
  // yeniden hesaplanan listeden index ile alınır.
  const options = buildAvatarOptions(userId);
  const option = typeof index === "number" ? options[index] : undefined;
  if (!option) {
    return NextResponse.json({ error: "Geçersiz avatar seçimi" }, { status: 400 });
  }

  const avatarUrl = dicebearUrl(option.seed, option.style);
  await prisma.user.update({ where: { id: userId }, data: { avatarUrl } });

  return NextResponse.json({ avatarUrl });
}
