import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { checkContent } from "@/lib/reviewValidation";
import { questionCreateSchema, formatZodError } from "@/lib/schemas";
import { sendNewQuestionEmail } from "@/lib/email";
import { createNotification } from "@/lib/notification";
import { stripGenRangeAnywhere } from "@/lib/modelDisplay";

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Giriş gerekli." }, { status: 401 });

  const parsed = questionCreateSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 });
  }
  const { productSlug, text } = parsed.data;

  const contentCheck = checkContent(text);
  if (!contentCheck.ok) {
    return NextResponse.json({ error: contentCheck.error }, { status: 400 });
  }

  const userId = parseInt(session.user.id);

  const [product, user] = await Promise.all([
    prisma.product.findUnique({ where: { slug: productSlug }, select: { id: true, name: true } }),
    prisma.user.findUnique({ where: { id: userId }, select: { emailVerifiedAt: true, displayName: true } }),
  ]);

  if (!product) return NextResponse.json({ error: "Araç bulunamadı." }, { status: 404 });
  if (!user?.emailVerifiedAt) {
    return NextResponse.json(
      { error: "Soru sormak için e-posta adresinizi doğrulamanız gerekiyor." },
      { status: 403 }
    );
  }

  const question = await prisma.question.create({
    data: { productId: product.id, userId, text },
  });

  // Sahiplik yorumcularına (yayınlanmış yorum sahipleri + garajda bağlı kullanıcılar) bildirim gönder — best-effort
  const [reviewers, garageOwners] = await Promise.all([
    prisma.review.findMany({
      where: { productId: product.id, status: "PUBLISHED", userId: { not: userId } },
      select: { user: { select: { id: true, email: true, displayName: true } } },
      distinct: ["userId"],
    }),
    prisma.userProduct.findMany({
      where: { productId: product.id, ownershipStatus: "CURRENT", userId: { not: userId } },
      select: { user: { select: { id: true, email: true, displayName: true } } },
      distinct: ["userId"],
    }),
  ]);
  const recipients = new Map<number, { email: string; displayName: string | null }>();
  for (const r of [...reviewers, ...garageOwners]) {
    recipients.set(r.user.id, { email: r.user.email, displayName: r.user.displayName });
  }
  const vehicleName = stripGenRangeAnywhere(product.name);
  for (const [recipientId, r] of recipients) {
    sendNewQuestionEmail({
      to: r.email,
      displayName: r.displayName,
      vehicleName,
      questionText: text,
      productSlug,
      userId: recipientId,
    }).catch(() => {});
    createNotification({
      userId: recipientId,
      type: "NEW_QUESTION",
      message: `${vehicleName} hakkında yeni bir soru soruldu: "${text}"`,
      link: `/araclar/${productSlug}?sekme=soru-cevap`,
    });
  }

  return NextResponse.json({ ok: true, questionId: question.id }, { status: 201 });
}
