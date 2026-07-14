import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || (session.user.trustLevel as number) < 5) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 403 });
  }

  const { id } = await params;
  const userId = parseInt(id);

  await prisma.user.update({
    where: { id: userId },
    data: { isBanned: false, banReason: null, bannedAt: null },
  });

  return NextResponse.json({ ok: true });
}
