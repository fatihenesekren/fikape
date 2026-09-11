import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { expertAppealCreateSchema, formatZodError } from "@/lib/schemas";
import { canFileNewAppeal, APPEAL_REVIEW_DUE_DAYS } from "@/lib/expertAppeal";
import { notifyAdmins } from "@/lib/notification";

// Usta itirazı oluşturma — "karar başına tek itiraz" (unique constraint'ler
// yakalar), "kayan 30 günde en fazla 2 itiraz" (uygulama katmanı).
export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Giriş gerekli." }, { status: 401 });
  const userId = parseInt(session.user.id);

  const profile = await prisma.expertProfile.findUnique({
    where: { userId },
    select: { id: true, status: true },
  });
  if (!profile || profile.status !== "ACTIVE") {
    return NextResponse.json({ error: "Yalnızca aktif ustalar itiraz edebilir." }, { status: 403 });
  }

  const parsed = expertAppealCreateSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 });
  const { subjectType, reason } = parsed.data;

  if (!(await canFileNewAppeal(profile.id))) {
    return NextResponse.json(
      { error: "Son 30 günde en fazla 2 itiraz yapabilirsiniz." },
      { status: 429 }
    );
  }

  let noteId: number | null = null;
  let period: string | null = null;

  if (subjectType === "NOTE_REJECTION") {
    noteId = Number(parsed.data.noteId);
    if (!Number.isInteger(noteId) || noteId <= 0) {
      return NextResponse.json({ error: "Geçersiz not." }, { status: 400 });
    }
    const note = await prisma.expertNote.findUnique({
      where: { id: noteId },
      select: { profileId: true, status: true },
    });
    if (!note || note.profileId !== profile.id) {
      return NextResponse.json({ error: "Not bulunamadı." }, { status: 404 });
    }
    if (note.status !== "REJECTED") {
      return NextResponse.json({ error: "Yalnızca reddedilen bir nota itiraz edilebilir." }, { status: 409 });
    }
    const existing = await prisma.expertAppeal.findUnique({ where: { noteId }, select: { id: true } });
    if (existing) return NextResponse.json({ error: "Bu not için zaten bir itiraz var." }, { status: 409 });
  } else {
    period = parsed.data.period ?? null;
    if (!period) return NextResponse.json({ error: "Geçersiz dönem." }, { status: 400 });
    const snapshot = await prisma.expertScoreSnapshot.findUnique({
      where: { profileId_period: { profileId: profile.id, period } },
      select: { decision: true },
    });
    if (!snapshot || snapshot.decision !== "PAUSED") {
      return NextResponse.json(
        { error: "Yalnızca duraklatılmış bir görünürlük kararına itiraz edilebilir." },
        { status: 409 }
      );
    }
    const existing = await prisma.expertAppeal.findUnique({
      where: { profileId_period: { profileId: profile.id, period } },
      select: { id: true },
    });
    if (existing) return NextResponse.json({ error: "Bu dönem için zaten bir itiraz var." }, { status: 409 });
  }

  const appeal = await prisma.expertAppeal.create({
    data: {
      profileId: profile.id,
      subjectType,
      noteId,
      period,
      reason,
      reviewDueAt: new Date(Date.now() + APPEAL_REVIEW_DUE_DAYS * 24 * 60 * 60 * 1000),
    },
    select: { id: true },
  });

  notifyAdmins({
    type: "ADMIN_NEW_EXPERT_APPEAL",
    message: "Onay bekleyen yeni bir usta itirazı var",
    link: "/admin/usta-itirazlari",
    emailSubject: "Yeni usta itirazı — inceleme bekliyor",
    emailTitle: "Yeni usta itirazı",
    emailMessage: `${subjectType === "NOTE_REJECTION" ? "Not reddi" : "Görünürlük kararı"} için yeni bir itiraz var.`,
    rateLimitKey: "expert-appeal",
  }).catch(() => {});

  return NextResponse.json({ ok: true, appealId: appeal.id }, { status: 201 });
}
