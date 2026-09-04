import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { notifyAdmins } from "@/lib/notification";

const VALID_TARGET_TYPES = ["SPEC", "PHOTO", "REVIEW", "QNA", "OTHER"] as const;
type TargetType = (typeof VALID_TARGET_TYPES)[number];

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Giriş gerekli." }, { status: 401 });
  }

  const { productId, targetType, field, photoId, reviewId, questionId, note } = await req.json();

  if (!VALID_TARGET_TYPES.includes(targetType)) {
    return NextResponse.json({ error: "Geçersiz bildirim türü." }, { status: 400 });
  }
  const trimmedNote = typeof note === "string" ? note.trim() : "";
  if (trimmedNote.length < 5) {
    return NextResponse.json({ error: "Lütfen sorunu kısaca açıklayın." }, { status: 400 });
  }
  const productIdNum = Number(productId);
  if (!Number.isInteger(productIdNum)) {
    return NextResponse.json({ error: "Geçersiz araç." }, { status: 400 });
  }

  const type = targetType as TargetType;

  await prisma.contentReport.create({
    data: {
      productId: productIdNum,
      reporterId: Number(session.user.id),
      targetType: type,
      field: type === "SPEC" && typeof field === "string" && field ? field : null,
      photoId: type === "PHOTO" && Number.isInteger(Number(photoId)) ? Number(photoId) : null,
      reviewId: type === "REVIEW" && Number.isInteger(Number(reviewId)) ? Number(reviewId) : null,
      questionId: type === "QNA" && Number.isInteger(Number(questionId)) ? Number(questionId) : null,
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
