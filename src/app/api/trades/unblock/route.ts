import { NextResponse } from "next/server";
import { pozitifTamsayiId } from "@/lib/validateId";
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
  const blockedId = pozitifTamsayiId(body?.userId);
  if (blockedId === null) {
    return NextResponse.json({ error: "Geçersiz kullanıcı." }, { status: 400 });
  }

  // Çiftin görüşmelerindeki "engellendi" işareti de kalkmalı: engel koyarken blockedByUserId/blockedAt görüşmelere yazılır
  // (api/trades/threads/[id]/block). Yalnız BlockedUser silinirse görüşme sonsuza dek "Engellendi" görünür ve listeden
  // kaldıracak bir kayıt kalmaz. Kapalı görüşmeler yine OTOMATİK açılmaz ("Görüşmeyi kapattın" + Yeniden aç düğmesi görünür).
  await prisma.$transaction([
    prisma.blockedUser.deleteMany({ where: { blockerId: userId, blockedId } }),
    prisma.messageThread.updateMany({
      where: {
        blockedByUserId: userId,
        OR: [
          { initiatorId: userId, tradeListing: { userId: blockedId } },
          { initiatorId: blockedId, tradeListing: { userId } },
        ],
      },
      data: { blockedByUserId: null, blockedAt: null },
    }),
  ]);

  return NextResponse.json({ ok: true });
}
