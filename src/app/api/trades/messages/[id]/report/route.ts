import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { messageReportSchema, formatZodError } from "@/lib/schemas";
import { checkRateLimit } from "@/lib/rateLimit";
import { isTradeMessagingEnabled } from "@/lib/features";
import { notifyAdmins } from "@/lib/notification";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isTradeMessagingEnabled()) {
    return NextResponse.json({ error: "Bu özellik geçici olarak kapalı." }, { status: 503 });
  }

  const session = await auth();
  if (!session) return NextResponse.json({ error: "Giriş gerekli." }, { status: 401 });

  const { id } = await params;
  const messageId = parseInt(id);
  if (isNaN(messageId)) return NextResponse.json({ error: "Mesaj bulunamadı." }, { status: 404 });

  const reporterId = Number(session.user.id);

  const message = await prisma.message.findUnique({
    where: { id: messageId },
    select: {
      id: true,
      senderId: true,
      thread: { select: { initiatorId: true, tradeListing: { select: { userId: true } } } },
    },
  });
  if (!message) return NextResponse.json({ error: "Mesaj bulunamadı." }, { status: 404 });

  const isThreadParty =
    message.thread.initiatorId === reporterId || message.thread.tradeListing.userId === reporterId;
  if (!isThreadParty || message.senderId === reporterId) {
    return NextResponse.json({ error: "Mesaj bulunamadı." }, { status: 404 });
  }

  const parsed = messageReportSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 });
  }

  if (!(await checkRateLimit(`trade-report:${reporterId}`, 5, 24 * 60 * 60 * 1000))) {
    return NextResponse.json({ error: "Günlük rapor gönderme sınırına ulaştınız." }, { status: 429 });
  }

  const report = await prisma.messageReport.create({
    data: {
      messageId,
      reporterId,
      reason: parsed.data.reason,
      note: parsed.data.note ?? null,
    },
  });

  notifyAdmins({
    type: "ADMIN_NEW_MESSAGE_REPORT",
    message: "Yeni bir mesaj raporu geldi.",
    link: "/admin/mesaj-raporlari",
    emailSubject: "Yeni mesaj raporu",
    emailTitle: "Yeni bir mesaj raporlandı",
    emailMessage: "Bir kullanıcı takas mesajlaşmasında bir mesajı raporladı.",
    rateLimitKey: "message-report",
  }).catch(() => {});

  return NextResponse.json({ ok: true, id: report.id }, { status: 201 });
}
