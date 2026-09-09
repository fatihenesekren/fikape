import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Yetkisiz." }, { status: 403 });

  // Ban geri döndürülemez bir aksiyon — admin yetkisi (trustLevel) JWT'de sadece
  // login anında yazıldığı için burada DB'den taze kontrol ediliyor
  // (bkz. api/admin/message-reports/[id]/route.ts aynı gerekçe).
  const adminUser = await prisma.user.findUnique({
    where: { id: Number(session.user.id) },
    select: { trustLevel: true },
  });
  if (!adminUser || adminUser.trustLevel < 5) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 403 });
  }

  const { id } = await params;
  const userId = parseInt(id);
  if (isNaN(userId)) return NextResponse.json({ error: "Geçersiz kullanıcı." }, { status: 400 });

  const { reason } = await req.json().catch(() => ({ reason: null }));

  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: { trustLevel: true, isBanned: true },
  });
  if (!target) return NextResponse.json({ error: "Kullanıcı bulunamadı." }, { status: 404 });
  if (target.trustLevel >= 5) {
    return NextResponse.json({ error: "Bir yöneticiyi banlayamazsınız." }, { status: 403 });
  }
  if (target.isBanned) return NextResponse.json({ ok: true });

  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: {
        isBanned: true,
        banReason: typeof reason === "string" && reason.trim() ? reason.trim().slice(0, 300) : "İçerik filtresi tekrarlı ihlal",
        bannedAt: new Date(),
      },
    }),
    prisma.tradeListing.updateMany({
      where: { userId, isActive: true },
      data: { isActive: false, closedAt: new Date() },
    }),
  ]);

  return NextResponse.json({ ok: true });
}
