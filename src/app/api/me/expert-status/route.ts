import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isTradeListingEnabled } from "@/lib/features";

// Usta (ve Takas paneli) durumu JWT'de tutulmuyor (bkz. fix_admin_trustlevel_jwt_donuyor —
// aynı sınıf risk: askıya alınan bir usta, JWT'ye yazılsaydı session süresi
// boyunca header'da "Usta Panelim" girişini görmeye devam ederdi). Bunun
// yerine her istekte DB'den taze okunur, header (client component) burayı
// mount'ta çağırır — MessageBell'deki /api/messages/preview ile aynı desen.
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ isActiveExpert: false, hasTakasPanel: false });
  }

  const userId = Number(session.user.id);
  // Takas Panelim menü girişi: garajında aracı olan üye ve takas özelliği açıkken (ana sayfadaki Takas bandıyla aynı kural;
  // özellik kapalıyken panel yalnız "kullanılamıyor" der). Aynı istekte tek hafif ek sorgu.
  const [profile, arac] = await Promise.all([
    prisma.expertProfile.findUnique({ where: { userId }, select: { status: true } }),
    isTradeListingEnabled()
      ? prisma.userProduct.findFirst({ where: { userId, ownershipStatus: "CURRENT" }, select: { id: true } }).catch(() => null)
      : null,
  ]);

  return NextResponse.json({ isActiveExpert: profile?.status === "ACTIVE", hasTakasPanel: arac != null });
}
