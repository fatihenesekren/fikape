import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { notifyAdmins } from "@/lib/notification";

const VALID_TARGET_TYPES = ["SPEC", "PHOTO", "REVIEW", "QNA", "EXPERT_NOTE", "EXPERT_WORKPLACE_PHOTO", "OTHER"] as const;
type TargetType = (typeof VALID_TARGET_TYPES)[number];
// Ürüne değil MODEL/USTA seviyesindeki bir şeye bağlanan türler — schema'daki
// CHECK constraint gereği bunlarda productId NULL kalmalı (bkz. prisma/schema.prisma
// ContentReport yorumu).
const PRODUCTLESS_TARGET_TYPES: readonly TargetType[] = ["EXPERT_NOTE", "EXPERT_WORKPLACE_PHOTO"];

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Giriş gerekli." }, { status: 401 });
  }

  const { productId, targetType, field, photoId, reviewId, questionId, expertNoteId, workplacePhotoId, note } = await req.json();

  if (!VALID_TARGET_TYPES.includes(targetType)) {
    return NextResponse.json({ error: "Geçersiz bildirim türü." }, { status: 400 });
  }
  const trimmedNote = typeof note === "string" ? note.trim() : "";
  if (trimmedNote.length < 5) {
    return NextResponse.json({ error: "Lütfen sorunu kısaca açıklayın." }, { status: 400 });
  }

  const type = targetType as TargetType;
  const isProductless = PRODUCTLESS_TARGET_TYPES.includes(type);

  const productIdNum = Number(productId);
  if (!isProductless && !Number.isInteger(productIdNum)) {
    return NextResponse.json({ error: "Geçersiz araç." }, { status: 400 });
  }

  await prisma.contentReport.create({
    data: {
      productId: isProductless ? null : productIdNum,
      reporterId: Number(session.user.id),
      targetType: type,
      field: type === "SPEC" && typeof field === "string" && field ? field : null,
      photoId: type === "PHOTO" && Number.isInteger(Number(photoId)) ? Number(photoId) : null,
      reviewId: type === "REVIEW" && Number.isInteger(Number(reviewId)) ? Number(reviewId) : null,
      questionId: type === "QNA" && Number.isInteger(Number(questionId)) ? Number(questionId) : null,
      expertNoteId: type === "EXPERT_NOTE" && Number.isInteger(Number(expertNoteId)) ? Number(expertNoteId) : null,
      workplacePhotoId: type === "EXPERT_WORKPLACE_PHOTO" && Number.isInteger(Number(workplacePhotoId)) ? Number(workplacePhotoId) : null,
      note: trimmedNote.slice(0, 500),
    },
  });

  notifyAdmins({
    type: "ADMIN_NEW_CONTENT_REPORT",
    message: "Yeni bir içerik bildirimi geldi.",
    link: "/admin/icerik-bildirimleri",
    emailSubject: "Yeni içerik bildirimi",
    emailTitle: "Yeni bir içerik hatası bildirildi",
    emailMessage: "Bir kullanıcı bir araç sayfasında içerik hatası bildirdi.",
    rateLimitKey: "content-report",
  }).catch(() => {});

  return NextResponse.json({ ok: true });
}
