import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const WINDOW_DAYS = 90; // barem'in kayan penceresiyle aynı — bunun dışındaki oylar zaten sayılmıyor
const TIME_CLUSTER_MINUTES = 10;
const TIME_CLUSTER_MIN_VOTES = 3;
const CAPTIVE_MIN_DISTINCT_NOTES = 5;

// ⚠️ BİLİNÇLİ SADELEŞTİRME (plan §10'un tam listesinden):
// - "Aynı-ilçe çapraz-oy" tespiti YOK — voter'ın etkileşim bağlamındaki ilçesi
//   hiçbir yerde tutulmuyor (User.city bölgesel eşleştirme için ayrı bir alan,
//   bunu güvenilir şekilde bağlamak için ek veri gerekir).
// - IP/cihaz örtüşmesi yalnız AYNI NOTA gelen oylar arasında karşılaştırılıyor
//   (platform çapında genel bir "aynı IP'den çok hesap" analizi değil).
// - Sinyaller BAĞIMSIZ çarpanlar olarak birleştiriliyor (ağırlıklı bir model
//   değil) — gerçek veriyle kalibre edilecek, tıpkı barem formülü gibi.
export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const windowStart = new Date(Date.now() - WINDOW_DAYS * 24 * 60 * 60 * 1000);

  const votes = await prisma.expertNoteVote.findMany({
    where: { createdAt: { gte: windowStart } },
    select: {
      id: true, noteId: true, userId: true, createdAt: true, ipHash: true, userAgentHash: true,
      note: { select: { profileId: true, profile: { select: { userId: true } } } },
    },
  });
  if (votes.length === 0) return NextResponse.json({ ok: true, evaluated: 0 });

  const voterIds = [...new Set(votes.map((v) => v.userId))];
  const voterExpertProfiles = await prisma.expertProfile.findMany({
    where: { userId: { in: voterIds } },
    select: { userId: true, id: true },
  });
  const expertOwnerByUserId = new Map(voterExpertProfiles.map((p) => [p.userId, p.id]));

  // ── Sinyal 1: zaman kümelenmesi (aynı notta kısa sürede çok oy) ──
  const votesByNote = new Map<number, typeof votes>();
  for (const v of votes) {
    const arr = votesByNote.get(v.noteId) ?? [];
    arr.push(v);
    votesByNote.set(v.noteId, arr);
  }
  const clusteredVoteIds = new Set<number>();
  for (const noteVotes of votesByNote.values()) {
    const sorted = [...noteVotes].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    for (let i = 0; i < sorted.length; i++) {
      const windowEnd = sorted[i].createdAt.getTime() + TIME_CLUSTER_MINUTES * 60 * 1000;
      const cluster = sorted.filter((v) => v.createdAt.getTime() >= sorted[i].createdAt.getTime() && v.createdAt.getTime() <= windowEnd);
      if (cluster.length >= TIME_CLUSTER_MIN_VOTES) {
        for (const c of cluster) clusteredVoteIds.add(c.id);
      }
    }
  }

  // ── Sinyal 2: IP/cihaz örtüşmesi (aynı notta birden çok oycu aynı hash'i paylaşıyor) ──
  const overlapVoteIds = new Set<number>();
  for (const noteVotes of votesByNote.values()) {
    const byIp = new Map<string, number>();
    const byUa = new Map<string, number>();
    for (const v of noteVotes) {
      if (v.ipHash) byIp.set(v.ipHash, (byIp.get(v.ipHash) ?? 0) + 1);
      if (v.userAgentHash) byUa.set(v.userAgentHash, (byUa.get(v.userAgentHash) ?? 0) + 1);
    }
    for (const v of noteVotes) {
      const ipShared = v.ipHash && (byIp.get(v.ipHash) ?? 0) > 1;
      const uaShared = v.userAgentHash && (byUa.get(v.userAgentHash) ?? 0) > 1;
      if (ipShared || uaShared) overlapVoteIds.add(v.id);
    }
  }

  // ── Sinyal 3: esir-kitle (bir oycu aynı ustanın ≥5 farklı notuna oy vermiş) ──
  const captiveVoteIds = new Set<number>();
  const votesByVoterAndUsta = new Map<string, typeof votes>();
  for (const v of votes) {
    const key = `${v.userId}:${v.note.profileId}`;
    const arr = votesByVoterAndUsta.get(key) ?? [];
    arr.push(v);
    votesByVoterAndUsta.set(key, arr);
  }
  for (const arr of votesByVoterAndUsta.values()) {
    const distinctNotes = new Set(arr.map((v) => v.noteId)).size;
    if (distinctNotes >= CAPTIVE_MIN_DISTINCT_NOTES) {
      for (const v of arr) captiveVoteIds.add(v.id);
    }
  }

  // ── Sinyal 4: usta→usta karşılıklı oy (A, B'nin notuna oy verdi VE B, A'nın notuna oy verdi) ──
  const reciprocalVoteIds = new Set<number>();
  const expertVotesByPair = new Map<string, { id: number; a: number; b: number }[]>();
  for (const v of votes) {
    const voterProfileId = expertOwnerByUserId.get(v.userId);
    if (voterProfileId == null) continue; // oycu usta değilse bu sinyal uygulanmaz
    if (voterProfileId === v.note.profileId) continue; // kendi notu zaten engelli, güvenlik
    const pairKey = [voterProfileId, v.note.profileId].sort((a, b) => a - b).join(":");
    const arr = expertVotesByPair.get(pairKey) ?? [];
    arr.push({ id: v.id, a: voterProfileId, b: v.note.profileId });
    expertVotesByPair.set(pairKey, arr);
  }
  for (const arr of expertVotesByPair.values()) {
    const directions = new Set(arr.map((e) => `${e.a}->${e.b}`));
    // İki yönde de en az bir oy varsa (A->B ve B->A) karşılıklılık şüphesi
    const hasBothDirections = [...directions].some((d) => {
      const [a, b] = d.split("->");
      return directions.has(`${b}->${a}`);
    });
    if (hasBothDirections) {
      for (const e of arr) reciprocalVoteIds.add(e.id);
    }
  }

  // ── Güven skorunu hesapla ve yaz ──
  const updates = votes.map((v) => {
    let confidence = 1;
    if (clusteredVoteIds.has(v.id)) confidence *= 0.5;
    if (overlapVoteIds.has(v.id)) confidence *= 0.4;
    if (captiveVoteIds.has(v.id)) confidence *= 0.3;
    if (reciprocalVoteIds.has(v.id)) confidence *= 0.5;
    confidence = Math.max(0.05, Math.min(1, confidence));
    return { id: v.id, confidence };
  });

  const changed = updates.filter((u) => u.confidence !== 1);
  await Promise.all(
    changed.map((u) => prisma.expertNoteVote.update({ where: { id: u.id }, data: { voteConfidence: u.confidence } }))
  );
  // Bu dönemde flag'lenmeyen ama önceki koşuda düşük skor almış oylar temizlensin
  const cleanIds = updates.filter((u) => u.confidence === 1).map((u) => u.id);
  if (cleanIds.length > 0) {
    await prisma.expertNoteVote.updateMany({
      where: { id: { in: cleanIds }, voteConfidence: { not: 1 } },
      data: { voteConfidence: 1 },
    });
  }

  return NextResponse.json({
    ok: true,
    evaluated: votes.length,
    flaggedClustered: clusteredVoteIds.size,
    flaggedOverlap: overlapVoteIds.size,
    flaggedCaptive: captiveVoteIds.size,
    flaggedReciprocal: reciprocalVoteIds.size,
    updated: changed.length,
    ranAt: new Date().toISOString(),
  });
}
