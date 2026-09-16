import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { generateSingleCardSummary } from "@/lib/ai/vehicleSummary";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Yetkisiz." }, { status: 403 });

  const adminUser = await prisma.user.findUnique({
    where: { id: Number(session.user.id) },
    select: { trustLevel: true },
  });
  if (!adminUser || adminUser.trustLevel < 5) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 403 });
  }

  const { id } = await params;
  const summaryId = parseInt(id);
  if (isNaN(summaryId)) return NextResponse.json({ error: "Kayıt bulunamadı." }, { status: 404 });

  const { action } = (await req.json().catch(() => ({}))) as { action?: "approve" | "reject" | "regenerate" };
  if (action !== "approve" && action !== "reject" && action !== "regenerate") {
    return NextResponse.json({ error: "Geçersiz işlem." }, { status: 400 });
  }

  const summary = await prisma.aiVehicleSummary.findUnique({
    where: { id: summaryId },
    select: { id: true, status: true, mode: true, productId: true },
  });
  if (!summary) return NextResponse.json({ error: "Kayıt bulunamadı." }, { status: 404 });
  if (summary.mode !== "SINGLE_CARD" || summary.status !== "PENDING_APPROVAL") {
    return NextResponse.json({ error: "Bu kayıt bu işlem için uygun durumda değil." }, { status: 409 });
  }

  if (action === "approve") {
    await prisma.aiVehicleSummary.update({
      where: { id: summaryId },
      data: { status: "APPROVED", approvedAt: new Date(), approvedByUserId: Number(session.user.id) },
    });
    return NextResponse.json({ ok: true, status: "APPROVED" });
  }

  if (action === "reject") {
    await prisma.aiVehicleSummary.update({
      where: { id: summaryId },
      data: { status: "REJECTED", rejectedAt: new Date() },
    });
    return NextResponse.json({ ok: true, status: "REJECTED" });
  }

  // regenerate — mevcut PENDING_APPROVAL kaydı silip yeniden üretir (aynı üründe
  // tekil satır kısıtı olduğu için upsert değil, önce sil).
  await prisma.aiVehicleSummary.delete({ where: { id: summaryId } });
  await generateSingleCardSummary(summary.productId);
  return NextResponse.json({ ok: true, status: "REGENERATED" });
}
