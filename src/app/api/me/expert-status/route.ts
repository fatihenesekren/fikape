import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// Usta durumu JWT'de tutulmuyor (bkz. fix_admin_trustlevel_jwt_donuyor —
// aynı sınıf risk: askıya alınan bir usta, JWT'ye yazılsaydı session süresi
// boyunca header'da "Usta Panelim" girişini görmeye devam ederdi). Bunun
// yerine her istekte DB'den taze okunur, header (client component) burayı
// mount'ta çağırır — MessageBell'deki /api/messages/preview ile aynı desen.
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ isActiveExpert: false });
  }

  const profile = await prisma.expertProfile.findUnique({
    where: { userId: Number(session.user.id) },
    select: { status: true },
  });

  return NextResponse.json({ isActiveExpert: profile?.status === "ACTIVE" });
}
