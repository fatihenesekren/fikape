import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

function currentPeriod(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

// Admin görünürlük override'ı — formülü iki yönde de ezer. Her karar
// ExpertOverrideEvent'e gerekçe koduyla loglanır → formül gerçeğe karşı
// kalibre edilir (bkz. plan §8 R10).
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
  const profileId = parseInt(id);
  if (isNaN(profileId)) return NextResponse.json({ error: "Geçersiz profil." }, { status: 400 });

  const { action, reasonCode } = await req.json().catch(() => ({})) as {
    action?: "force_featured" | "force_paused" | "clear";
    reasonCode?: string;
  };

  const profile = await prisma.expertProfile.findUnique({
    where: { id: profileId },
    select: { status: true, visibilityState: true },
  });
  if (!profile) return NextResponse.json({ error: "Profil bulunamadı." }, { status: 404 });
  if (profile.status !== "ACTIVE") {
    return NextResponse.json({ error: "Yalnızca aktif ustalar için görünürlük yönetilebilir." }, { status: 409 });
  }

  const fromState = profile.visibilityState;
  let toState = fromState;
  let adminOverride: "FORCE_FEATURED" | "FORCE_PAUSED" | null = null;

  if (action === "force_featured") { toState = "FEATURED"; adminOverride = "FORCE_FEATURED"; }
  else if (action === "force_paused") { toState = "PAUSED"; adminOverride = "FORCE_PAUSED"; }
  else if (action === "clear") { adminOverride = null; }
  else return NextResponse.json({ error: "Geçersiz işlem." }, { status: 400 });

  await prisma.expertProfile.update({
    where: { id: profileId },
    data: { adminOverride, ...(action !== "clear" ? { visibilityState: toState } : {}) },
  });

  if (action !== "clear" && toState !== fromState) {
    await prisma.expertOverrideEvent.create({
      data: {
        profileId, period: currentPeriod(new Date()),
        fromState, toState, adminId,
        reasonCode: (reasonCode || "ADMIN_MANUAL").slice(0, 40),
      },
    });
  }

  return NextResponse.json({ ok: true, visibilityState: action === "clear" ? fromState : toState, adminOverride });
}
