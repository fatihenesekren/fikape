import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 403 });
  }

  // Admin yetkisi (trustLevel) JWT'de sadece login anında yazılıyor ve normal
  // isteklerde DB'den yenilenmiyor — bu ban işlemi geri döndürülemez bir aksiyon
  // olduğu için burada özellikle taze kontrol ediliyor (bkz. denetim raporu:
  // "yetkisi geri alınan bir admin, mevcut oturumu boyunca ban atmaya devam edebiliyordu").
  const adminUser = await prisma.user.findUnique({
    where: { id: Number(session.user.id) },
    select: { trustLevel: true },
  });
  if (!adminUser || adminUser.trustLevel < 5) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 403 });
  }

  const { id } = await params;
  const reportId = parseInt(id);
  const { action } = await req.json().catch(() => ({ action: null }));
  if (action !== "ban") {
    return NextResponse.json({ error: "Geçersiz aksiyon." }, { status: 400 });
  }

  const report = await prisma.messageReport.findUnique({
    where: { id: reportId },
    select: { id: true, reason: true, message: { select: { senderId: true } } },
  });
  if (!report) return NextResponse.json({ error: "Rapor bulunamadı." }, { status: 404 });

  const bannedUserId = report.message.senderId;

  await prisma.$transaction([
    prisma.user.update({
      where: { id: bannedUserId },
      data: { isBanned: true, banReason: `Mesaj raporu: ${report.reason}`, bannedAt: new Date() },
    }),
    prisma.tradeListing.updateMany({
      where: { userId: bannedUserId, isActive: true },
      data: { isActive: false, closedAt: new Date() },
    }),
    prisma.messageReport.update({ where: { id: reportId }, data: { status: "REVIEWED" } }),
  ]);

  return NextResponse.json({ ok: true });
}
