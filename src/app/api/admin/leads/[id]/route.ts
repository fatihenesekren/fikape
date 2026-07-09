import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || (session.user.trustLevel as number) < 5) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 403 });
  }

  const { id } = await params;
  const { status, kind } = await req.json();
  if (!["NEW", "CONTACTED", "PENDING", "COMPLETED", "NOT_DONE"].includes(status)) {
    return NextResponse.json({ error: "Geçersiz durum." }, { status: 400 });
  }
  if (!["insurance", "sale"].includes(kind)) {
    return NextResponse.json({ error: "Geçersiz tür." }, { status: 400 });
  }

  if (kind === "insurance") {
    await prisma.insuranceLead.update({ where: { id: Number(id) }, data: { status } });
  } else {
    await prisma.saleLead.update({ where: { id: Number(id) }, data: { status } });
  }

  return NextResponse.json({ ok: true });
}
