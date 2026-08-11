import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Giriş gerekli." }, { status: 401 });

  const { id } = await params;
  const searchId = parseInt(id);
  if (isNaN(searchId)) return NextResponse.json({ error: "Geçersiz kayıt." }, { status: 400 });

  const userId = Number(session.user.id);

  const search = await prisma.savedSearch.findUnique({
    where: { id: searchId },
    select: { userId: true },
  });
  if (!search || search.userId !== userId) {
    return NextResponse.json({ error: "Kayıt bulunamadı." }, { status: 404 });
  }

  await prisma.savedSearch.delete({ where: { id: searchId } });
  return NextResponse.json({ ok: true });
}
