import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { messageReportSchema, formatZodError } from "@/lib/schemas";
import { checkRateLimit } from "@/lib/rateLimit";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

  const parsed = messageReportSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 });
  }

  if (!checkRateLimit(`trade-report:${reporterId}`, 5, 24 * 60 * 60 * 1000)) {
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

  return NextResponse.json({ ok: true, id: report.id }, { status: 201 });
}
