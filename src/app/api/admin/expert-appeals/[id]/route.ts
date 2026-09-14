import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notification";

// Usta itirazı kararı — uphold (ret/karar korunur) / overturn (bozulur).
// Overturn NOTE_REJECTION: not tekrar PENDING'e döner (admin yeniden, düzgün
// bir kalite puanıyla onaylasın — doğrudan PUBLISHED'a atlamak
// approvedQualityScore'suz bırakır). Overturn VISIBILITY_DECISION: profil
// FORCE_FEATURED override'ı alır (bir sonraki cron'a kadar kalıcı).
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Yetkisiz." }, { status: 403 });

  const adminId = Number(session.user.id);
  const adminUser = await prisma.user.findUnique({ where: { id: adminId }, select: { trustLevel: true } });
  if (!adminUser || adminUser.trustLevel < 5) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 403 });
  }

  const { id } = await params;
  const appealId = parseInt(id);
  if (isNaN(appealId)) return NextResponse.json({ error: "Geçersiz itiraz." }, { status: 400 });

  const { action, decisionNote } = await req.json().catch(() => ({})) as {
    action?: "uphold" | "overturn";
    decisionNote?: string;
  };

  const appeal = await prisma.expertAppeal.findUnique({
    where: { id: appealId },
    select: {
      status: true, subjectType: true, noteId: true, period: true,
      profile: { select: { id: true, userId: true } },
    },
  });
  if (!appeal) return NextResponse.json({ error: "İtiraz bulunamadı." }, { status: 404 });
  if (appeal.status !== "PENDING") {
    return NextResponse.json({ error: "Bu itiraz bu işlem için uygun durumda değil." }, { status: 409 });
  }

  if (action === "overturn") {
    if (appeal.subjectType === "NOTE_REJECTION" && appeal.noteId) {
      // Not, itiraz PENDING'te beklerken (kullanıcı düzenleyip yeniden
      // moderasyona düşürdüğü veya admin ayrı bir ekrandan işlem yaptığı
      // için) artık REJECTED olmayabilir — koşulsuz PENDING'e çekmek,
      // arada onaylanıp YAYINA GİRMİŞ güncel bir içeriği sessizce geri
      // çeker. `updateMany` ile notun HÂLÂ REJECTED olduğunu doğrulayıp
      // değilse itirazı karara bağlamadan 409 dönüyoruz.
      const { count } = await prisma.expertNote.updateMany({
        where: { id: appeal.noteId, status: "REJECTED" },
        data: { status: "PENDING", rejectedAt: null, rejectionReason: null },
      });
      if (count === 0) {
        return NextResponse.json(
          { error: "Not artık reddedilmiş durumda değil (muhtemelen kullanıcı düzenleyip yeniden gönderdi) — itiraz karara bağlanamadı, kuyruktan kaldırmak için admin panelinden notun güncel durumunu kontrol edin." },
          { status: 409 }
        );
      }
    } else if (appeal.subjectType === "VISIBILITY_DECISION") {
      await prisma.expertProfile.update({
        where: { id: appeal.profile.id },
        data: { adminOverride: "FORCE_FEATURED", visibilityState: "FEATURED" },
      });
    }
  }

  await prisma.expertAppeal.update({
    where: { id: appealId },
    data: {
      status: action === "overturn" ? "OVERTURNED" : "UPHELD",
      decidedBy: adminId,
      decidedAt: new Date(),
      decisionNote: decisionNote?.slice(0, 600) || null,
    },
  });

  createNotification({
    userId: appeal.profile.userId,
    type: "EXPERT_APPEAL_DECIDED",
    message: action === "overturn"
      ? "İtirazınız kabul edildi — karar gözden geçirildi."
      : "İtirazınız incelendi — orijinal karar korundu.",
    link: appeal.subjectType === "NOTE_REJECTION" ? "/usta-gorusu/notlarim" : "/usta-gorusu/profil",
  });

  return NextResponse.json({ ok: true });
}
