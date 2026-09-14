import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// Engeli kaldır — Profil › Engellenen kullanıcılar bölümünden. Yalnızca kendi
// koyduğun engeli kaldırabilirsin. Kapatılmış görüşmeleri OTOMATİK açmaz;
// karşı taraf yeniden görüşme başlatabilir hâle gelir.
// Not: `BlockedUser` artık hem Takas hem Usta engellemelerini kapsıyor
// (source alanı, bkz. schema) — bu yüzden Takas'a özel isTradeMessagingEnabled
// kapısı kaldırıldı; feature flag kapalıyken bile usta-kaynaklı bir engel
// kaldırılabilmeli.
export async function POST(req: Request) {
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
