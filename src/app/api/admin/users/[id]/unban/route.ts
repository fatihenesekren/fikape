import { NextResponse } from "next/server";
import { pozitifTamsayiId } from "@/lib/validateId";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
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
  const userId = pozitifTamsayiId(id);
  if (userId === null) return NextResponse.json({ error: "Geçersiz kimlik." }, { status: 400 });

  await prisma.user.update({
    where: { id: userId },
    data: { isBanned: false, banReason: null, bannedAt: null },
  });

  return NextResponse.json({ ok: true });
}
