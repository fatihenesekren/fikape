import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || (session.user.trustLevel as number) < 5) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 403 });
  }

  const { id } = await params;
  const reportId = parseInt(id);
  const { action } = await req.json();
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
