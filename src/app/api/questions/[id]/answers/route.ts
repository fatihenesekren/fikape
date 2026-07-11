import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { checkContent } from "@/lib/reviewValidation";
import { answerCreateSchema, formatZodError } from "@/lib/schemas";
import { sendQuestionAnsweredEmail } from "@/lib/email";
import { createNotification } from "@/lib/notification";
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

  const contentCheck = checkContent(text);
  if (!contentCheck.ok) {
    return NextResponse.json({ error: contentCheck.error }, { status: 400 });
  }

  const userId = parseInt(session.user.id);

  const [question, user] = await Promise.all([
    prisma.question.findUnique({
      where: { id: questionId },
      select: {
        id: true,
        userId: true,
        productId: true,
        user: { select: { email: true, displayName: true } },
        product: { select: { name: true, slug: true } },
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

  const ownership = await prisma.userProduct.findUnique({
    where: { userId_productId: { userId, productId: question.productId } },
    select: { id: true },
  });
  if (!ownership) {
    return NextResponse.json(
      { error: "Sadece bu aracı garajında bulunduran veya kullanıp satmış kullanıcılar cevap verebilir." },
      { status: 403 }
    );
  }

  const answer = await prisma.answer.create({
    data: { questionId, userId, text },
  });

  if (question.userId !== userId) {
    const vehicleName = stripGenRangeAnywhere(question.product.name);
    sendQuestionAnsweredEmail({
      to: question.user.email,
      displayName: question.user.displayName,
      vehicleName,
      productSlug: question.product.slug,
      userId: question.userId,
    }).catch(() => {});
    createNotification({
      userId: question.userId,
      type: "QUESTION_ANSWERED",
      message: `${vehicleName} hakkında sorduğun soru cevaplandı`,
      link: `/araclar/${question.product.slug}?sekme=soru-cevap`,
    });
  }

  return NextResponse.json({ ok: true, answerId: answer.id }, { status: 201 });
}
