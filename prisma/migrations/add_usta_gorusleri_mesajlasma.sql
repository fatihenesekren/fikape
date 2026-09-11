-- ═══════════════════════════════════════════════════════════════════
-- USTA GÖRÜŞLERI — Aşama 6b: site-içi maskeli mesajlaşma
-- Tam tasarım: docs/usta-gorusleri-plan.md §7
--
-- Supabase SQL Editor'de çalıştırın. Bölüm A (enum ADD VALUE) ÖNCE ve TEK
-- BAŞINA, sonra Bölüm B.
-- ═══════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────
-- BÖLÜM A
-- ─────────────────────────────────────────────────────────────────
BEGIN;

ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'NEW_EXPERT_MESSAGE';

COMMIT;


-- ─────────────────────────────────────────────────────────────────
-- BÖLÜM B
-- ─────────────────────────────────────────────────────────────────
BEGIN;

CREATE TABLE "expert_message_threads" (
    "id"              SERIAL       NOT NULL,
    "expertProfileId" INTEGER      NOT NULL,
    "initiatorId"     INTEGER      NOT NULL,
    "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastMessageAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "expert_message_threads_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "expert_message_threads_expertProfileId_initiatorId_key" ON "expert_message_threads" ("expertProfileId", "initiatorId");
ALTER TABLE "expert_message_threads" ADD CONSTRAINT "expert_message_threads_expertProfileId_fkey"
    FOREIGN KEY ("expertProfileId") REFERENCES "expert_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "expert_message_threads" ADD CONSTRAINT "expert_message_threads_initiatorId_fkey"
    FOREIGN KEY ("initiatorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "expert_messages" (
    "id"        SERIAL       NOT NULL,
    "threadId"  INTEGER      NOT NULL,
    "senderId"  INTEGER      NOT NULL,
    "text"      VARCHAR(1000) NOT NULL,
    "isRead"    BOOLEAN      NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "expert_messages_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "expert_messages_threadId_createdAt_idx" ON "expert_messages" ("threadId", "createdAt");
ALTER TABLE "expert_messages" ADD CONSTRAINT "expert_messages_threadId_fkey"
    FOREIGN KEY ("threadId") REFERENCES "expert_message_threads"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "expert_messages" ADD CONSTRAINT "expert_messages_senderId_fkey"
    FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

COMMIT;
