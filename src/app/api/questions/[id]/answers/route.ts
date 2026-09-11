import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { checkContent } from "@/lib/reviewValidation";
import { logContentFilterHit } from "@/lib/contentFilterLog";
import { answerCreateSchema, formatZodError } from "@/lib/schemas";
import { sendQuestionAnsweredEmail } from "@/lib/email";
import { createNotification, notifyAdmins } from "@/lib/notification";
import { stripGenRangeAnywhere } from "@/lib/modelDisplay";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Giriş gerekli." }, { status: 401 });

  const { id } = await params;
  const questionId = parseInt(id);
  if (isNaN(questionId)) return NextResponse.json({ error: "Geçersiz soru." }, { status: 400 });

  const parsed = answerCreateSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 });
  }
  const { text } = parsed.data;

  const userId = parseInt(session.user.id);

  const contentCheck = checkContent(text);
  if (!contentCheck.ok) {
    logContentFilterHit({ userId, surface: "QNA", rule: contentCheck.rule });
    return NextResponse.json({ error: contentCheck.error }, { status: 400 });
  }

  const [question, user] = await Promise.all([
    prisma.question.findUnique({
      where: { id: questionId },
      select: {
        id: true,
        userId: true,
        productId: true,
        expertNoteId: true,
        user: { select: { email: true, displayName: true } },
        product: { select: { name: true, slug: true } },
        expertNote: { select: { title: true } },
      },
    }),
    prisma.user.findUnique({ where: { id: userId }, select: { emailVerifiedAt: true } }),
  ]);

  if (!question) return NextResponse.json({ error: "Soru bulunamadı." }, { status: 404 });
  if (!user?.emailVerifiedAt) {
    return NextResponse.json(
      { error: "Cevap yazmak için e-posta adresinizi doğrulamanız gerekiyor." },
      { status: 403 }
    );
  }
  if (question.userId === userId) {
    return NextResponse.json({ error: "Kendi sorunuzu cevaplayamazsınız." }, { status: 403 });
  }

  // ── Usta notu altındaki soru — "B modeli": cevabı yalnız doğrulanmış
  // (ExpertStatus=ACTIVE) ustalar verebilir; her cevap moderasyondan geçer. ──
  if (question.expertNoteId != null) {
    const expertProfile = await prisma.expertProfile.findUnique({
      where: { userId },
      select: { id: true, status: true },
    });
    if (!expertProfile || expertProfile.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "Bu soruyu yalnızca doğrulanmış ustalar cevaplayabilir." },
        { status: 403 }
      );
    }

    const existingAnswerCount = await prisma.answer.count({ where: { questionId, userId } });
    if (existingAnswerCount >= 3) {
      return NextResponse.json({ error: "Bu soruya en fazla 3 cevap yazabilirsiniz." }, { status: 403 });
    }

    const answer = await prisma.answer.create({
      data: { questionId, userId, text, status: "PENDING", answeredByExpertProfileId: expertProfile.id },
    });

    notifyAdmins({
      type: "ADMIN_NEW_EXPERT_NOTE",
      message: "Onay bekleyen yeni bir usta notu cevabı var",
      link: "/admin/usta-notlari",
      emailSubject: "Yeni usta notu cevabı — onay bekliyor",
      emailTitle: "Yeni usta notu cevabı",
      emailMessage: `"${question.expertNote?.title ?? ""}" başlıklı usta notuna gelen bir soru cevaplandı, moderasyon bekliyor.`,
      rateLimitKey: "expert-note-answer",
    }).catch(() => {});

    return NextResponse.json({ ok: true, answerId: answer.id, status: "PENDING" }, { status: 201 });
  }

  // ── Araç sayfası soru-cevabı — mevcut sahiplik kuralı ──
  if (question.productId == null || question.product == null) {
    return NextResponse.json({ error: "Bu soru bu uçtan cevaplanamaz." }, { status: 400 });
  }
  const productId = question.productId;
  const product = question.product;

  const ownership = await prisma.userProduct.findUnique({
    where: { userId_productId: { userId, productId } },
    select: { id: true },
  });
  if (!ownership) {
    return NextResponse.json(
      { error: "Sadece bu aracı garajında bulunduran veya kullanıp satmış kullanıcılar cevap verebilir." },
      { status: 403 }
    );
  }

  const existingAnswerCount = await prisma.answer.count({
    where: { questionId, userId },
  });
  if (existingAnswerCount >= 3) {
    return NextResponse.json(
      { error: "Bu soruya en fazla 3 cevap yazabilirsiniz." },
      { status: 403 }
    );
  }

  const answer = await prisma.answer.create({
    data: { questionId, userId, text },
  });

  if (question.userId !== userId) {
    const vehicleName = stripGenRangeAnywhere(product.name);
    sendQuestionAnsweredEmail({
      to: question.user.email,
      displayName: question.user.displayName,
      vehicleName,
      productSlug: product.slug,
      userId: question.userId,
    }).catch(() => {});
    createNotification({
      userId: question.userId,
      type: "QUESTION_ANSWERED",
      message: `${vehicleName} hakkında sorduğun soru cevaplandı`,
      // Slug değil id — katalog bakımında slug değişse bile link kırılmasın (bkz. /urun/[id]).
      link: `/urun/${productId}?sekme=soru-cevap`,
    });
  }

  return NextResponse.json({ ok: true, answerId: answer.id }, { status: 201 });
}
