import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { checkContent } from "@/lib/reviewValidation";
import { logContentFilterHit } from "@/lib/contentFilterLog";
import { expertNoteQuestionSchema, formatZodError } from "@/lib/schemas";

// Usta notu altındaki bir SORUYU düzenleme/silme — kullanıcı fark etti:
// soruyu soran ne düzeltebiliyor ne silebiliyordu. Yalnız usta notu
// sorularını kapsar (expertNoteId != null) — ürün Q&A'sının kendi sahiplik
// kuralları var, buraya dokunulmuyor. Question'da moderasyon/status alanı
// hiç yok (baştan beri beyan esaslı) — düzenleme bir yeniden-inceleme
// tetiklemez, doğrudan güncellenir.
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Giriş gerekli." }, { status: 401 });
  const userId = parseInt(session.user.id);

  const { id } = await params;
  const questionId = parseInt(id);
  if (isNaN(questionId)) return NextResponse.json({ error: "Geçersiz soru." }, { status: 400 });

  const parsed = expertNoteQuestionSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 });
  const { text } = parsed.data;

  const contentCheck = checkContent(text);
  if (!contentCheck.ok) {
    logContentFilterHit({ userId, surface: "EXPERT_QNA", rule: contentCheck.rule });
    return NextResponse.json({ error: contentCheck.error }, { status: 400 });
  }

  const question = await prisma.question.findUnique({
    where: { id: questionId },
    select: { userId: true, expertNoteId: true },
  });
  if (!question || question.expertNoteId == null) {
    return NextResponse.json({ error: "Soru bulunamadı." }, { status: 404 });
  }
  if (question.userId !== userId) {
    return NextResponse.json({ error: "Yalnızca kendi sorunuzu düzenleyebilirsiniz." }, { status: 403 });
  }

  await prisma.question.update({ where: { id: questionId }, data: { text } });
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Giriş gerekli." }, { status: 401 });
  const userId = parseInt(session.user.id);

  const { id } = await params;
  const questionId = parseInt(id);
  if (isNaN(questionId)) return NextResponse.json({ error: "Geçersiz soru." }, { status: 400 });

  const question = await prisma.question.findUnique({
    where: { id: questionId },
    select: { userId: true, expertNoteId: true },
  });
  if (!question || question.expertNoteId == null) {
    return NextResponse.json({ error: "Soru bulunamadı." }, { status: 404 });
  }
  if (question.userId !== userId) {
    return NextResponse.json({ error: "Yalnızca kendi sorunuzu silebilirsiniz." }, { status: 403 });
  }

  // Altındaki cevap(lar) da birlikte silinir — FK RESTRICT olduğu için önce
  // cevaplar, sonra soru (tek transaction).
  await prisma.$transaction([
    prisma.answer.deleteMany({ where: { questionId } }),
    prisma.question.delete({ where: { id: questionId } }),
  ]);

  return NextResponse.json({ ok: true });
}
