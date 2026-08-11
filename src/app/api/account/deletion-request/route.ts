import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { deletionRequestSchema, formatZodError } from "@/lib/schemas";

const DUE_DAYS = 30; // KVKK: 30 gün içinde tamamlanmalı

// Hesap silme talebi — DataDeletionRequest modeli daha önce şemada tanımlıydı
// ama hiçbir route bunu kullanmıyordu (bkz. denetim raporu, KRİTİK madde).
export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Giriş gerekli." }, { status: 401 });

  const userId = Number(session.user.id);

  const existing = await prisma.dataDeletionRequest.findFirst({
    where: { userId, status: { in: ["PENDING", "IN_PROGRESS"] } },
  });
  if (existing) {
    return NextResponse.json({ error: "Zaten bekleyen bir hesap silme talebiniz var." }, { status: 409 });
  }

  const parsed = deletionRequestSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 });
  }

  const dueAt = new Date(Date.now() + DUE_DAYS * 24 * 60 * 60 * 1000);
  const request = await prisma.dataDeletionRequest.create({
    data: { userId, reason: parsed.data.reason ?? null, dueAt },
  });

  return NextResponse.json({ ok: true, id: request.id, dueAt }, { status: 201 });
}

export async function DELETE() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Giriş gerekli." }, { status: 401 });

  const userId = Number(session.user.id);

  const existing = await prisma.dataDeletionRequest.findFirst({
    where: { userId, status: "PENDING" },
  });
  if (!existing) {
    return NextResponse.json({ error: "İptal edilecek bekleyen bir talep bulunamadı." }, { status: 404 });
  }

  await prisma.dataDeletionRequest.delete({ where: { id: existing.id } });
  return NextResponse.json({ ok: true });
}
