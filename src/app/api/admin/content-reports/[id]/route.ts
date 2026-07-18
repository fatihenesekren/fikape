import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });
  }
  const adminUser = await prisma.user.findUnique({
    where: { id: Number(session.user.id) },
    select: { trustLevel: true },
  });
  if (!adminUser || adminUser.trustLevel < 5) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 403 });
  }

  const { id } = await params;
  const reportId = parseInt(id);
  const { status } = await req.json();
  if (status !== "RESOLVED" && status !== "REJECTED") {
    return NextResponse.json({ error: "Geçersiz durum." }, { status: 400 });
  }

  await prisma.contentReport.update({
    where: { id: reportId },
    data: { status, resolvedAt: new Date(), resolvedBy: Number(session.user.id) },
  });

  return NextResponse.json({ ok: true });
}
