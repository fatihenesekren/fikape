import { NextResponse } from "next/server";
import { pozitifTamsayiId } from "@/lib/validateId";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Yetkisiz." }, { status: 403 });

  const adminUser = await prisma.user.findUnique({
    where: { id: Number(session.user.id) },
    select: { trustLevel: true },
  });
  if (!adminUser || adminUser.trustLevel < 5) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 403 });
  }

  const { id: ham } = await params;
  const id = pozitifTamsayiId(ham);
  if (id === null) return NextResponse.json({ error: "Geçersiz kimlik." }, { status: 400 });
  const { status, kind } = (await req.json().catch(() => null)) ?? {};
  if (!["NEW", "CONTACTED", "PENDING", "COMPLETED", "NOT_DONE"].includes(status)) {
    return NextResponse.json({ error: "Geçersiz durum." }, { status: 400 });
  }
  if (!["insurance", "sale"].includes(kind)) {
    return NextResponse.json({ error: "Geçersiz tür." }, { status: 400 });
  }

  if (kind === "insurance") {
    await prisma.insuranceLead.update({ where: { id }, data: { status } });
  } else {
    await prisma.saleLead.update({ where: { id }, data: { status } });
  }

  return NextResponse.json({ ok: true });
}
