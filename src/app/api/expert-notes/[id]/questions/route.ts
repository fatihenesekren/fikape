import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { checkContent } from "@/lib/reviewValidation";
import { logContentFilterHit } from "@/lib/contentFilterLog";
import { expertNoteQuestionSchema, formatZodError } from "@/lib/schemas";
import { createNotification } from "@/lib/notification";
import { stripGenRangeAnywhere } from "@/lib/modelDisplay";

// Usta notu altında soru — "B modeli": soruyu herkes sorar (sahiplik şartı
// yok), cevabı yalnız notu yazan usta veya diğer doğrulanmış ustalar verir
// (bkz. api/questions/[id]/answers). İletişim bilgisi paylaşımı bu yüzeyde de
// filtrelenir (§14.9 — moderasyonsuz kanal asla).
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Giriş gerekli." }, { status: 401 });

  const { id } = await params;
  const noteId = parseInt(id);
  if (isNaN(noteId)) return NextResponse.json({ error: "Geçersiz not." }, { status: 400 });

  const parsed = expertNoteQuestionSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 });
  }
  const { text } = parsed.data;

  const userId = parseInt(session.user.id);

  const contentCheck = checkContent(text);
  if (!contentCheck.ok) {
    logContentFilterHit({ userId, surface: "EXPERT_QNA", rule: contentCheck.rule });
    return NextResponse.json({ error: contentCheck.error }, { status: 400 });
  }

  const [note, user] = await Promise.all([
    prisma.expertNote.findUnique({
      where: { id: noteId },
      select: {
        status: true, title: true,
        profile: { select: { userId: true } },
        model: {
          select: {
            products: {
              where: { isActive: true },
              orderBy: { weeklyViewCount: "desc" },
              take: 1,
              select: { slug: true },
            },
          },
        },
      },
    }),
    prisma.user.findUnique({ where: { id: userId }, select: { emailVerifiedAt: true } }),
  ]);
  if (!note || note.status !== "PUBLISHED") {
    return NextResponse.json({ error: "Not bulunamadı." }, { status: 404 });
  }
  // Usta kendi notuna kendi kendine soru soramaz (kullanıcı fark etti — Q&A'nın
  // "B modeli" mantığı bunu hiç engellemiyordu).
  if (note.profile.userId === userId) {
    return NextResponse.json({ error: "Kendi notunuza soru soramazsınız." }, { status: 400 });
  }
  if (!user?.emailVerifiedAt) {
    return NextResponse.json(
      { error: "Soru sormak için e-posta adresinizi doğrulamanız gerekiyor." },
      { status: 403 }
    );
  }

  const question = await prisma.question.create({
    data: { expertNoteId: noteId, userId, text },
    select: { id: true },
  });

  // Bildirim linki artık gerçek araç sayfasına + Usta Görüşleri sekmesine
  // gidiyor (önceden hep "/usta-gorusu/yaz"e sabitti — kullanıcı fark etti).
  const productSlug = note.model.products[0]?.slug;
  const noteTitle = stripGenRangeAnywhere(note.title);
  createNotification({
    userId: note.profile.userId,
    type: "NEW_QUESTION",
    message: `"${noteTitle}" başlıklı usta notunuza yeni bir soru soruldu`,
    link: productSlug ? `/araclar/${productSlug}?sekme=usta-gorusleri#usta-not-${noteId}` : "/",
  });

  return NextResponse.json({ ok: true, questionId: question.id }, { status: 201 });
}
