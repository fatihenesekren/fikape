// ─────────────────────────────────────────────
// USTA GÖRÜŞLERI — Görünürlük baremi (Aşama 7). Tam tasarım: docs/usta-gorusleri-plan.md §8.
//
// ⚠️ BİLİNÇLİ SADELEŞTİRMELER (gerçek veriyle kalibre edilecek — plan da
// bunu öngörüyor). Aşağıdaki noktalarda plan metninin tam algoritması yerine
// daha basit, açıkça belgelenmiş bir yaklaşım kullanıldı:
//   - qualityAvgNorm: "dönem platform ortalamasına normalize" yerine sabit
//     /2 (0/1/2 puan aralığı) normalizasyonu — birkaç ustayla platform
//     ortalaması anlamsız derecede gürültülü olurdu.
//   - voterDiversity: "tekrarlayan oycu-not çiftleri" oranı yerine basitçe
//     (tekil oycu sayısı / toplam oy) — aynı yönü ölçer, daha ucuz hesaplanır.
//   - Esir-kitle (captive audience) ve aynı-ilçe çapraz-oy tespiti YOK —
//     ayrı bir "oy sahteciliği" gecelik işi gerektiriyor, henüz yapılmadı.
//   - Marka yanlılığı: yalnızca YAPISAL kontrol (%40 üstü tek marka payı) —
//     "net-olumsuz duygulu" tespiti NLP gerektirir, YOK.
//   - Reddedilen-şikâyet-oranı-p90 cezası YOK (platform çapında persentil
//     hesabı, henüz anlamlı veri yok).
//   - "Grace'te tek ret → PROBATION" kuralı ret gerekçesini (pazarlama/
//     marka kötüleme) metinden ayırt ETMİYOR — grace içinde HERHANGİ bir
//     ret bu kurala takılır.
//   - Not-altı usta cevapları "yalnız aktiflik kapısı" — barem hesabında
//     zaten sıfır ağırlık (plan §18'de zaten böyleydi).
// ─────────────────────────────────────────────

import { prisma } from "@/lib/prisma";
import type { ExpertVisibility } from "@/generated/prisma/client";

export const BAREM_WINDOW_DAYS = 90;
export const FEATURED_THRESHOLD = 0.55;
export const PAUSE_THRESHOLD = 0.40;
export const MODERATION_PASS_MIN = 0.70;
export const MIN_LIFETIME_NOTES = 3;
export const ACTIVITY_WINDOW_DAYS = 180;
export const NOTE_MIN_AGE_DAYS = 14;
export const MAX_MODEL_NOTES_COUNTED = 3;
export const MIN_VOTES_TO_COUNT_NOTE = 5;
export const VOTER_MIN_TRUST_LEVEL = 2;
export const VOTER_MIN_ACCOUNT_AGE_DAYS = 60;
export const BRAND_CONCENTRATION_PENALTY_THRESHOLD = 0.4;

const DAY_MS = 24 * 60 * 60 * 1000;

export interface BaremResult {
  eligible: boolean;
  reasonCodes: string[];
  distinctModelQualityNotes: number;
  qualityAvgNorm: number;
  helpfulWilson: number;
  voterDiversity: number;
  reportRate: number;
  penalties: number;
  rawScore: number;
  /** Bu dönemin ham skoruna göre önerilen durum — histerezis cron'da uygulanır. */
  periodSuggestion: "FEATURED_OK" | "PAUSE_CANDIDATE" | "HOLD";
  /** Grace içindeyken bölgesel yüzeyi açacak sıkı koşul sağlandı mı. */
  graceQualifies: boolean;
}

// 90% güven aralığı (z=1.645) — plan §8'deki Wilson alt sınırı.
function wilsonLowerBound(positive: number, total: number, z = 1.645): number {
  if (total === 0) return 0;
  const phat = positive / total;
  const denom = 1 + (z * z) / total;
  const center = phat + (z * z) / (2 * total);
  const margin = z * Math.sqrt((phat * (1 - phat)) / total + (z * z) / (4 * total * total));
  return Math.max(0, (center - margin) / denom);
}

export async function computeExpertStanding(profileId: number, now: Date = new Date()): Promise<BaremResult> {
  const notes = await prisma.expertNote.findMany({
    where: { profileId },
    select: {
      id: true, status: true, modelId: true, createdAt: true, publishedAt: true,
      approvedQualityScore: true,
      model: { select: { brandId: true } },
    },
  });
  const published = notes.filter((n) => n.status === "PUBLISHED");
  const rejected = notes.filter((n) => n.status === "REJECTED");

  // ── Uygunluk kapısı ──
  const reasonCodes: string[] = [];
  const gate1 = published.length >= MIN_LIFETIME_NOTES;
  if (!gate1) reasonCodes.push("GATE_MIN_NOTES");

  const activityWindowStart = new Date(now.getTime() - ACTIVITY_WINDOW_DAYS * DAY_MS);
  const gate2 = published.some((n) => (n.publishedAt ?? n.createdAt) >= activityWindowStart);
  if (!gate2) reasonCodes.push("GATE_INACTIVE_180D");

  const noteIds = published.map((n) => n.id);
  const pendingReports = noteIds.length
    ? await prisma.contentReport.count({
        where: { targetType: "EXPERT_NOTE", expertNoteId: { in: noteIds }, status: "PENDING" },
      })
    : 0;
  const gate3 = pendingReports === 0;
  if (!gate3) reasonCodes.push("GATE_UNRESOLVED_REPORT");

  const totalDecided = published.length + rejected.length;
  const passRate = totalDecided > 0 ? published.length / totalDecided : 1;
  const gate4 = passRate >= MODERATION_PASS_MIN;
  if (!gate4) reasonCodes.push("GATE_MODERATION_PASS_RATE");

  const eligible = gate1 && gate2 && gate3 && gate4;

  if (!eligible) {
    return {
      eligible: false, reasonCodes,
      distinctModelQualityNotes: 0, qualityAvgNorm: 0, helpfulWilson: 0,
      voterDiversity: 0, reportRate: pendingReports, penalties: 0, rawScore: 0,
      periodSuggestion: "HOLD", graceQualifies: false,
    };
  }

  // ── Dönem (90 gün kayan) ──
  const windowStart = new Date(now.getTime() - BAREM_WINDOW_DAYS * DAY_MS);
  const minAgeCutoff = new Date(now.getTime() - NOTE_MIN_AGE_DAYS * DAY_MS);

  const periodNotes = published.filter((n) => n.createdAt >= windowStart && n.createdAt <= minAgeCutoff);
  const qualityScored = periodNotes.filter((n) => n.approvedQualityScore != null);
  const qualityAvg = qualityScored.length
    ? qualityScored.reduce((s, n) => s + (n.approvedQualityScore ?? 0), 0) / qualityScored.length
    : 0;
  const qualityAvgNorm = Math.min(1, qualityAvg / 2);

  // Model kapsamı — dönemde model başına en fazla 1, kaliteli (≥1) not
  const qualifying = periodNotes.filter((n) => (n.approvedQualityScore ?? 0) >= 1);
  const seenModels = new Set<number>();
  for (const n of qualifying) seenModels.add(n.modelId);
  const distinctModelQualityNotes = Math.min(seenModels.size, MAX_MODEL_NOTES_COUNTED);

  // ── Faydalı oy (Wilson alt sınırı, filtrelenmiş) ──
  const periodNoteIds = periodNotes.map((n) => n.id);
  const votes = periodNoteIds.length
    ? await prisma.expertNoteVote.findMany({
        where: { noteId: { in: periodNoteIds }, createdAt: { gte: windowStart } },
        select: { userId: true, isHelpful: true, voteConfidence: true, createdAt: true, noteId: true },
      })
    : [];
  const voterIds = [...new Set(votes.map((v) => v.userId))];
  const voters = voterIds.length
    ? await prisma.user.findMany({ where: { id: { in: voterIds } }, select: { id: true, trustLevel: true, createdAt: true } })
    : [];
  const voterById = new Map(voters.map((v) => [v.id, v]));

  const filteredVotes = votes.filter((v) => {
    const voter = voterById.get(v.userId);
    if (!voter || voter.trustLevel < VOTER_MIN_TRUST_LEVEL) return false;
    const accountAgeAtVote = v.createdAt.getTime() - voter.createdAt.getTime();
    return accountAgeAtVote >= VOTER_MIN_ACCOUNT_AGE_DAYS * DAY_MS;
  });
  // Yalnız 5+ (filtrelenmiş) oyu olan notlar sayılır
  const votesByNote = new Map<number, typeof filteredVotes>();
  for (const v of filteredVotes) {
    const arr = votesByNote.get(v.noteId) ?? [];
    arr.push(v);
    votesByNote.set(v.noteId, arr);
  }
  const countedVotes = [...votesByNote.values()].filter((arr) => arr.length >= MIN_VOTES_TO_COUNT_NOTE).flat();
  const positiveVotes = countedVotes.filter((v) => v.isHelpful).length;
  const helpfulWilson = wilsonLowerBound(positiveVotes, countedVotes.length);
  const avgVoteConfidence = countedVotes.length
    ? countedVotes.reduce((s, v) => s + v.voteConfidence, 0) / countedVotes.length
    : 1;

  const distinctVoters = new Set(countedVotes.map((v) => v.userId)).size;
  const voterDiversity = countedVotes.length ? Math.min(1, distinctVoters / countedVotes.length) : 1;

  let helpfulTerm = 0.15 * helpfulWilson * avgVoteConfidence;
  if (voterDiversity < 0.5) helpfulTerm *= voterDiversity;

  // ── Cezalar ──
  const resolvedReports = noteIds.length
    ? await prisma.contentReport.count({
        where: { targetType: "EXPERT_NOTE", expertNoteId: { in: noteIds }, status: "RESOLVED", resolvedAt: { gte: windowStart } },
      })
    : 0;
  const reportPenalty = 0.15 * (Math.min(resolvedReports, 2) / 2);

  const brandCounts = new Map<number, number>();
  for (const n of periodNotes) brandCounts.set(n.model.brandId, (brandCounts.get(n.model.brandId) ?? 0) + 1);
  const maxBrandShare = periodNotes.length
    ? Math.max(...[...brandCounts.values()]) / periodNotes.length
    : 0;
  const brandPenalty = maxBrandShare > BRAND_CONCENTRATION_PENALTY_THRESHOLD ? 0.10 : 0;
  if (brandPenalty > 0) reasonCodes.push("PENALTY_BRAND_CONCENTRATION");

  const penalties = reportPenalty + brandPenalty;

  const rawScore = Math.max(
    0,
    0.55 * qualityAvgNorm +
      0.20 * (distinctModelQualityNotes / MAX_MODEL_NOTES_COUNTED) +
      helpfulTerm +
      0.10 * voterDiversity -
      penalties
  );

  const periodSuggestion: BaremResult["periodSuggestion"] =
    rawScore >= FEATURED_THRESHOLD ? "FEATURED_OK" : rawScore < PAUSE_THRESHOLD ? "PAUSE_CANDIDATE" : "HOLD";

  // Grace'te bölgesel yüzeyi açacak sıkı koşul: ≥2 farklı modelde onaylı not
  // (tek modele yığılmayı önler — bkz. plan §8 grace notu).
  const approvedModelSet = new Set(published.map((n) => n.modelId));
  const graceQualifies = rawScore >= FEATURED_THRESHOLD && approvedModelSet.size >= 2;

  return {
    eligible: true, reasonCodes,
    distinctModelQualityNotes, qualityAvgNorm, helpfulWilson, voterDiversity,
    reportRate: pendingReports + resolvedReports, penalties, rawScore,
    periodSuggestion, graceQualifies,
  };
}

// Histerezis: bir önceki durum + bu dönemin önerisi + geçmiş snapshot'a göre
// nihai kararı verir. `previousDecisions` en yeniden en eskiye sıralı olmalı.
export function applyHysteresis(params: {
  currentState: ExpertVisibility;
  result: BaremResult;
  inGrace: boolean;
  hadRejectionDuringGrace: boolean;
  previousRawScores: number[]; // en yeniden eskiye
}): ExpertVisibility {
  const { currentState, result, inGrace, hadRejectionDuringGrace, previousRawScores } = params;

  if (!result.eligible) return "HIDDEN";

  if (inGrace) {
    if (hadRejectionDuringGrace) return "PROBATION";
    return result.graceQualifies ? "FEATURED" : "HIDDEN";
  }

  if (currentState === "FEATURED") {
    if (result.rawScore < PAUSE_THRESHOLD) {
      // Üst üste 2 ay < eşik olmalı — bir önceki snapshot da eşiğin altındaysa düş.
      const prevAlsoLow = previousRawScores.length > 0 && previousRawScores[0] < PAUSE_THRESHOLD;
      return prevAlsoLow ? "PAUSED" : "FEATURED";
    }
    return "FEATURED";
  }

  if (currentState === "PAUSED") {
    if (result.rawScore >= FEATURED_THRESHOLD) {
      const prevAlsoHigh = previousRawScores.length > 0 && previousRawScores[0] >= FEATURED_THRESHOLD;
      return prevAlsoHigh ? "FEATURED" : "PAUSED";
    }
    return "PAUSED";
  }

  // HIDDEN veya PROBATION'dan ilk giriş — tek dönem yeterli (asimetri yalnız
  // PAUSED→FEATURED dönüşünde var, bkz. plan).
  if (previousRawScores.length < 2) {
    // <2 snapshot varsa histerezisle PAUSE'a düşürme yok — yalnız kapıya bak.
    return result.rawScore >= FEATURED_THRESHOLD ? "FEATURED" : "HIDDEN";
  }
  return result.rawScore >= FEATURED_THRESHOLD ? "FEATURED" : "HIDDEN";
}
