import { createHmac } from "crypto";
import { prisma } from "@/lib/prisma";
import type { ReviewStatus } from "@/generated/prisma/client";

const SECRET = process.env.AUTH_SECRET!;

function hash(value: string): string {
  return createHmac("sha256", SECRET).update(value).digest("hex");
}

// KVKK: ham IP/UA hiçbir yerde tutulmaz, sadece hash'i.
export function hashRequestContext(req: Request): { ipHash: string | null; userAgentHash: string | null } {
  const forwardedFor = req.headers.get("x-forwarded-for");
  const ip = forwardedFor?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || null;
  const userAgent = req.headers.get("user-agent");

  return {
    ipHash: ip ? hash(ip) : null,
    userAgentHash: userAgent ? hash(userAgent) : null,
  };
}

export function recordScoreSnapshot(params: {
  reviewId: number;
  productId: number;
  trustScore: number;
  scoreOverall: number;
  status: ReviewStatus;
  reason: "CREATED" | "PUBLISHED" | "REJECTED" | "EDITED";
}) {
  return prisma.scoreSnapshot.create({ data: params });
}

export function recordModerationLog(params: {
  reviewId: number;
  moderatorId: number;
  action: "APPROVED" | "REJECTED";
  reason?: string | null;
}) {
  return prisma.moderationLog.create({ data: params });
}
