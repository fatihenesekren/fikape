import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { expertContactFeedbackSchema, formatZodError } from "@/lib/schemas";

// Topluluk iletişim teyidi — yalnız ustayla GERÇEKTEN iletişime geçmiş
// (bir ExpertMessageThread başlatmış) kullanıcılar oy verebilir; kişi başı
// tek oy (unique — güncellenebilir). Skor/barem'i etkilemez, yalnız
// telefon/adres kartında görünen bir topluluk sinyalidir (bkz. lib/expertContactFeedback.ts).
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Giriş gerekli." }, { status: 401 });

  const { id } = await params;
  const profileId = parseInt(id);
  if (isNaN(profileId)) return NextResponse.json({ error: "Geçersiz usta." }, { status: 400 });

  const parsed = expertContactFeedbackSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 });
  const { isAccurate } = parsed.data;

  const userId = parseInt(session.user.id);

  const profile = await prisma.expertProfile.findUnique({
    where: { id: profileId },
    select: { status: true, userId: true },
  });
  if (!profile || profile.status !== "ACTIVE") {
    return NextResponse.json({ error: "Usta bulunamadı." }, { status: 404 });
  }
  if (profile.userId === userId) {
    return NextResponse.json({ error: "Kendi profilinize geri bildirim veremezsiniz." }, { status: 403 });
  }

  const hasContacted = await prisma.expertMessageThread.findUnique({
    where: { expertProfileId_initiatorId: { expertProfileId: profileId, initiatorId: userId } },
    select: { id: true },
  });
  if (!hasContacted) {
    return NextResponse.json(
      { error: "Bu ustayla iletişime geçmeden geri bildirim veremezsiniz." },
      { status: 403 }
    );
  }

  await prisma.expertContactFeedback.upsert({
    where: { profileId_userId: { profileId, userId } },
    create: { profileId, userId, isAccurate },
    update: { isAccurate },
  });

  const confirmedCount = await prisma.expertContactFeedback.count({
    where: { profileId, isAccurate: true },
  });

  return NextResponse.json({ ok: true, confirmedCount });
}
