import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notification";
import { stripGenRangeAnywhere } from "@/lib/modelDisplay";

// Usta notu altındaki soru-cevabın moderasyonu (§14.9 — moderasyonsuz kanal asla).
export async function PATCH(
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
  const answerId = parseInt(id);
  if (isNaN(answerId)) return NextResponse.json({ error: "Geçersiz cevap." }, { status: 400 });

  const { action } = await req.json().catch(() => ({})) as { action?: "approve" | "reject" };

  const answer = await prisma.answer.findUnique({
    where: { id: answerId },
    select: {
      status: true, answeredByExpertProfileId: true,
      question: {
        select: {
          userId: true,
          expertNote: {
            select: {
              title: true,
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
          },
        },
      },
    },
  });
  if (!answer || answer.answeredByExpertProfileId == null) {
    return NextResponse.json({ error: "Cevap bulunamadı." }, { status: 404 });
  }
  if (answer.status !== "PENDING") {
    return NextResponse.json({ error: "Bu cevap bu işlem için uygun durumda değil." }, { status: 409 });
  }

  if (action === "approve") {
    await prisma.answer.update({ where: { id: answerId }, data: { status: "PUBLISHED" } });
    const noteTitle = answer.question.expertNote?.title ? stripGenRangeAnywhere(answer.question.expertNote.title) : "";
    const productSlug = answer.question.expertNote?.model.products[0]?.slug;
    createNotification({
      userId: answer.question.userId,
      type: "QUESTION_ANSWERED",
      message: `"${noteTitle}" başlıklı usta notuna sorduğun soru cevaplandı`,
      link: productSlug ? `/araclar/${productSlug}?sekme=usta-gorusleri` : "/",
    });
    return NextResponse.json({ ok: true, status: "PUBLISHED" });
  }

  if (action === "reject") {
    await prisma.answer.update({ where: { id: answerId }, data: { status: "REJECTED" } });
    return NextResponse.json({ ok: true, status: "REJECTED" });
  }

  return NextResponse.json({ error: "Geçersiz işlem." }, { status: 400 });
}
