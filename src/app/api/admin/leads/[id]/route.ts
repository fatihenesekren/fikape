import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session || (session.user.trustLevel as number) < 5) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 403 });
  }

  const { id } = await params;
  const { status } = await req.json();
  if (!["NEW", "CONTACTED", "CONVERTED"].includes(status)) {
    return NextResponse.json({ error: "Geçersiz durum." }, { status: 400 });
  }

  await prisma.insuranceLead.update({
    where: { id: Number(id) },
    data: { status },
  });

  return NextResponse.json({ ok: true });
}
