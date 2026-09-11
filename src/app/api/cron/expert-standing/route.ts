import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { computeExpertStanding, applyHysteresis } from "@/lib/expertBarem";
import { createNotification } from "@/lib/notification";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function currentPeriod(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

// Aylık barem — her ACTIVE ustanın görünürlük durumunu (HIDDEN/FEATURED/
// PAUSED/PROBATION) yeniden hesaplar. SUSPENDED/CLOSED/PENDING_VERIFICATION/
// WAITLISTED profillere ASLA dokunmaz (bkz. plan §8). Admin override
// (FORCE_FEATURED/FORCE_PAUSED) formülü ezer ama audit için skor yine hesaplanır.
export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const period = currentPeriod(now);

  const profiles = await prisma.expertProfile.findMany({
    where: { status: "ACTIVE" },
    select: { id: true, userId: true, visibilityState: true, graceUntil: true, adminOverride: true },
  });

  let featured = 0, paused = 0, hidden = 0, probation = 0;
  const notifications: Promise<unknown>[] = [];

  for (const profile of profiles) {
    const result = await computeExpertStanding(profile.id, now);

    const previousSnapshots = await prisma.expertScoreSnapshot.findMany({
      where: { profileId: profile.id },
      orderBy: { period: "desc" },
      take: 2,
      select: { rawScore: true },
    });
    const previousRawScores = previousSnapshots.map((s) => s.rawScore);

    const inGrace = !!profile.graceUntil && profile.graceUntil > now;
    let hadRejectionDuringGrace = false;
    if (inGrace && profile.graceUntil) {
      const graceStart = new Date(profile.graceUntil.getTime() - 60 * 24 * 60 * 60 * 1000);
      hadRejectionDuringGrace = (await prisma.expertNote.count({
        where: { profileId: profile.id, status: "REJECTED", rejectedAt: { gte: graceStart } },
      })) > 0;
    }

    let finalDecision = applyHysteresis({
      currentState: profile.visibilityState,
      result,
      inGrace,
      hadRejectionDuringGrace,
      previousRawScores,
    });

    // Admin override formülü ezer — ama sadece FEATURED/PAUSED yönünde;
    // HIDDEN/PROBATION hesaplanan karar olarak kalır (override bunlar için tanımsız).
    if (profile.adminOverride === "FORCE_FEATURED") finalDecision = "FEATURED";
    else if (profile.adminOverride === "FORCE_PAUSED") finalDecision = "PAUSED";

    await prisma.expertScoreSnapshot.upsert({
      where: { profileId_period: { profileId: profile.id, period } },
      create: {
        profileId: profile.id, period,
        distinctModelQualityNotes: result.distinctModelQualityNotes,
        qualityAvgNorm: result.qualityAvgNorm,
        helpfulWilson: result.helpfulWilson,
        voterDiversity: result.voterDiversity,
        reportRate: result.reportRate,
        penalties: result.penalties,
        rawScore: result.rawScore,
        decision: finalDecision,
      },
      update: {
        distinctModelQualityNotes: result.distinctModelQualityNotes,
        qualityAvgNorm: result.qualityAvgNorm,
        helpfulWilson: result.helpfulWilson,
        voterDiversity: result.voterDiversity,
        reportRate: result.reportRate,
        penalties: result.penalties,
        rawScore: result.rawScore,
        decision: finalDecision,
      },
    });

    await prisma.expertProfile.update({
      where: { id: profile.id },
      data: {
        visibilityState: finalDecision,
        lastScoredAt: now,
        currentPeriodScore: result.rawScore,
        // Grace, ihlal nedeniyle bitiyor (PROBATION'a düşünce) — erken sonlandır.
        graceUntil: inGrace && hadRejectionDuringGrace ? null : undefined,
      },
    });

    if (profile.visibilityState === "FEATURED" && finalDecision === "PAUSED") {
      notifications.push(
        createNotification({
          userId: profile.userId,
          type: "EXPERT_CV_PAUSED",
          message:
            "Profilinizin bölgesel görünürlük yüzeyindeki yeri şu an için duraklatıldı. Yayımlanmış notlarınız ve rozetiniz yerinde kalıyor.",
          link: "/usta-gorusu/yaz",
        })
      );
    } else if (profile.visibilityState === "PAUSED" && finalDecision === "FEATURED") {
      notifications.push(
        createNotification({
          userId: profile.userId,
          type: "EXPERT_CV_RESTORED",
          message: "Profilinizin bölgesel görünürlük yüzeyindeki yeri yeniden açıldı.",
          link: "/usta-gorusu/yaz",
        })
      );
    }

    if (finalDecision === "FEATURED") featured++;
    else if (finalDecision === "PAUSED") paused++;
    else if (finalDecision === "PROBATION") probation++;
    else hidden++;
  }

  await Promise.all(notifications);

  return NextResponse.json({
    ok: true, period, evaluated: profiles.length,
    featured, paused, hidden, probation,
    ranAt: now.toISOString(),
  });
}
