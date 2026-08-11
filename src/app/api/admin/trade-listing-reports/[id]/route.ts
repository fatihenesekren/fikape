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

  // Admin yetkisi (trustLevel) JWT'de değil, her istekte DB'den taze kontrol ediliyor
  // (bkz. api/admin/message-reports/[id]/route.ts'teki aynı düzeltme).
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

  const report = await prisma.tradeListingReport.findUnique({
    where: { id: reportId },
    select: { id: true, reason: true, tradeListing: { select: { userId: true } } },
  });
  if (!report) return NextResponse.json({ error: "Rapor bulunamadı." }, { status: 404 });

  if (action === "ban") {
    const bannedUserId = report.tradeListing.userId;
    await prisma.$transaction([
      prisma.user.update({
        where: { id: bannedUserId },
        data: { isBanned: true, banReason: `İlan raporu: ${report.reason}`, bannedAt: new Date() },
      }),
      prisma.tradeListing.updateMany({
        where: { userId: bannedUserId, isActive: true },
        data: { isActive: false, closedAt: new Date() },
      }),
      prisma.tradeListingReport.update({ where: { id: reportId }, data: { status: "REVIEWED" } }),
    ]);
    return NextResponse.json({ ok: true });
  }

  if (action === "dismiss") {
    await prisma.tradeListingReport.update({ where: { id: reportId }, data: { status: "REVIEWED" } });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Geçersiz aksiyon." }, { status: 400 });
}
