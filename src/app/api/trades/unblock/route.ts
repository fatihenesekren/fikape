import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isTradeMessagingEnabled } from "@/lib/features";

// Engeli kaldır — Profil › Engellenen kullanıcılar bölümünden. Yalnızca kendi
// koyduğun engeli kaldırabilirsin. Kapatılmış görüşmeleri OTOMATİK açmaz;
// karşı taraf yeniden görüşme başlatabilir hâle gelir.
export async function POST(req: Request) {
  if (!isTradeMessagingEnabled()) {
    return NextResponse.json({ error: "Bu özellik geçici olarak kapalı." }, { status: 503 });
  }

  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Giriş gerekli." }, { status: 401 });

  const userId = Number(session.user.id);
  const body = await req.json().catch(() => ({}));
  const blockedId = Number(body?.userId);
  if (!Number.isInteger(blockedId)) {
    return NextResponse.json({ error: "Geçersiz kullanıcı." }, { status: 400 });
  }

  await prisma.blockedUser.deleteMany({
    where: { blockerId: userId, blockedId },
  });

  return NextResponse.json({ ok: true });
}
