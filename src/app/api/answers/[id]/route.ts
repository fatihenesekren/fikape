import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { checkContent } from "@/lib/reviewValidation";
import { logContentFilterHit } from "@/lib/contentFilterLog";
import { answerCreateSchema, formatZodError } from "@/lib/schemas";

// Usta notu altındaki bir cevabı düzenleme/silme — kullanıcı fark etti:
// usta kendi cevabını ne düzeltebiliyor ne silebiliyordu. Bilinçli olarak
// yalnız USTA NOTU cevaplarını (answeredByExpertProfileId != null) kapsar —
// araç sayfasının normal soru-cevabı (garaj sahipliği tabanlı, ayrı bir akış)
// bu uca hiç dokunmuyor.
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Giriş gerekli." }, { status: 401 });
  const userId = parseInt(session.user.id);

  const { id } = await params;
  const answerId = parseInt(id);
  if (isNaN(answerId)) return NextResponse.json({ error: "Geçersiz cevap." }, { status: 400 });

  const parsed = answerCreateSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 });
  const { text } = parsed.data;

  const contentCheck = checkContent(text);
  if (!contentCheck.ok) {
    logContentFilterHit({ userId, surface: "QNA", rule: contentCheck.rule });
    return NextResponse.json({ error: contentCheck.error }, { status: 400 });
  }

  const answer = await prisma.answer.findUnique({
    where: { id: answerId },
    select: { userId: true, answeredByExpertProfileId: true },
  });
  if (!answer || answer.answeredByExpertProfileId == null) {
    return NextResponse.json({ error: "Cevap bulunamadı." }, { status: 404 });
  }
  if (answer.userId !== userId) {
    return NextResponse.json({ error: "Yalnızca kendi cevabınızı düzenleyebilirsiniz." }, { status: 403 });
  }

  // Düzenleme moderasyonu atlamaz — usta notlarındaki aynı ilke (bkz.
  // api/expert-notes/[id]/route.ts): içerik değişince yeniden incelemeye düşer.
  await prisma.answer.update({
    where: { id: answerId },
    data: { text, status: "PENDING" },
  });

  return NextResponse.json({ ok: true, status: "PENDING" });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Giriş gerekli." }, { status: 401 });
  const userId = parseInt(session.user.id);

  const { id } = await params;
  const answerId = parseInt(id);
  if (isNaN(answerId)) return NextResponse.json({ error: "Geçersiz cevap." }, { status: 400 });

  const answer = await prisma.answer.findUnique({
    where: { id: answerId },
    select: { userId: true, answeredByExpertProfileId: true },
  });
  if (!answer || answer.answeredByExpertProfileId == null) {
    return NextResponse.json({ error: "Cevap bulunamadı." }, { status: 404 });
  }
  if (answer.userId !== userId) {
    return NextResponse.json({ error: "Yalnızca kendi cevabınızı silebilirsiniz." }, { status: 403 });
  }

  // Hard delete — Answer modeli notlardaki gibi bir versiyon/soft-remove
  // altyapısı taşımıyor, RESTRICT edecek bir FK de yok.
  await prisma.answer.delete({ where: { id: answerId } });

  return NextResponse.json({ ok: true });
}
