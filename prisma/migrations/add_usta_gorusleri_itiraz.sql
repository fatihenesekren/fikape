-- ═══════════════════════════════════════════════════════════════════
-- USTA GÖRÜŞLERI — İtiraz akışı
-- Tam tasarım: docs/usta-gorusleri-plan.md §8/§10 (itiraz), Trust ajanı C4.
--
-- Supabase SQL Editor'de çalıştırın. Bölüm A (enum ADD VALUE) ÖNCE ve TEK
-- BAŞINA, sonra Bölüm B.
-- ═══════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────
-- BÖLÜM A
-- ─────────────────────────────────────────────────────────────────
BEGIN;

ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'ADMIN_NEW_EXPERT_APPEAL';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'EXPERT_APPEAL_DECIDED';

COMMIT;


-- ─────────────────────────────────────────────────────────────────
-- BÖLÜM B
-- ─────────────────────────────────────────────────────────────────
BEGIN;

CREATE TYPE "ExpertAppealSubject" AS ENUM ('NOTE_REJECTION', 'VISIBILITY_DECISION');
CREATE TYPE "ExpertAppealStatus" AS ENUM ('PENDING', 'UPHELD', 'OVERTURNED', 'AUTO_FINALIZED');

CREATE TABLE "expert_appeals" (
    "id"           SERIAL                 NOT NULL,
    "profileId"    INTEGER                NOT NULL,
    "subjectType"  "ExpertAppealSubject"  NOT NULL,
    "noteId"       INTEGER,
    "period"       VARCHAR(7),
    "reason"       TEXT                   NOT NULL,
    "status"       "ExpertAppealStatus"   NOT NULL DEFAULT 'PENDING',
    "decidedBy"    INTEGER,
    "decidedAt"    TIMESTAMP(3),
    "decisionNote" VARCHAR(600),
    "createdAt"    TIMESTAMP(3)           NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewDueAt"  TIMESTAMP(3)           NOT NULL,
    CONSTRAINT "expert_appeals_pkey" PRIMARY KEY ("id")
);
-- noteId nullable → yalnız dolu değerler arasında tekillik (NULL != NULL, Postgres varsayılanı)
CREATE UNIQUE INDEX "expert_appeals_noteId_key" ON "expert_appeals" ("noteId");
CREATE UNIQUE INDEX "expert_appeals_profileId_period_key" ON "expert_appeals" ("profileId", "period");
CREATE INDEX "expert_appeals_profileId_createdAt_idx" ON "expert_appeals" ("profileId", "createdAt");
CREATE INDEX "expert_appeals_status_reviewDueAt_idx" ON "expert_appeals" ("status", "reviewDueAt");

ALTER TABLE "expert_appeals" ADD CONSTRAINT "expert_appeals_profileId_fkey"
    FOREIGN KEY ("profileId") REFERENCES "expert_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "expert_appeals" ADD CONSTRAINT "expert_appeals_noteId_fkey"
    FOREIGN KEY ("noteId") REFERENCES "expert_notes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

COMMIT;
