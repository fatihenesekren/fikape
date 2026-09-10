-- ═══════════════════════════════════════════════════════════════════
-- USTA GÖRÜŞLERI — Aşama 1: şema
-- Tam tasarım: docs/usta-gorusleri-plan.md
--
-- Supabase SQL Editor'de çalıştırın. İKİ BÖLÜM:
--   Bölüm A (enum ADD VALUE) — Postgres'te ADD VALUE aynı transaction'da
--     kullanılamaz; ÖNCE bunu tek başına çalıştırın, COMMIT olsun.
--   Bölüm B (yeni tipler + tablolar + kolon değişiklikleri) — sonra çalıştırın.
--
-- Geri alma yok (ADD VALUE geri alınamaz). Mümkünse önce branch DB'de deneyin.
-- ═══════════════════════════════════════════════════════════════════


-- ─────────────────────────────────────────────────────────────────
-- BÖLÜM A — mevcut enum'lara değer ekle (ÖNCE, tek başına çalıştır)
-- ─────────────────────────────────────────────────────────────────
BEGIN;

ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'EXPERT_NOTE_PUBLISHED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'EXPERT_NOTE_REJECTED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'EXPERT_VERIFIED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'EXPERT_CV_PAUSED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'EXPERT_CV_RESTORED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'EXPERT_NOTE_TAKEDOWN_FILED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'EXPERT_NOTE_INTERIM_HIDDEN';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'EXPERT_NOTE_TAKEDOWN_RESOLVED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'ADMIN_NEW_EXPERT_NOTE';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'ADMIN_NEW_EXPERT_APPLICATION';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'ADMIN_NEW_TAKEDOWN_REQUEST';

ALTER TYPE "ConsentType" ADD VALUE IF NOT EXISTS 'EXPERT_DOC_VERIFICATION';
ALTER TYPE "ConsentType" ADD VALUE IF NOT EXISTS 'EXPERT_CONTACT_PUBLIC';
ALTER TYPE "ConsentType" ADD VALUE IF NOT EXISTS 'EXPERT_REGIONAL_PROMO';
ALTER TYPE "ConsentType" ADD VALUE IF NOT EXISTS 'EXPERT_PERFORMANCE_ANALYTICS';

ALTER TYPE "ContentReportTargetType" ADD VALUE IF NOT EXISTS 'EXPERT_NOTE';

COMMIT;


-- ─────────────────────────────────────────────────────────────────
-- BÖLÜM B — yeni enum tipleri, tablolar, kolon değişiklikleri
-- ─────────────────────────────────────────────────────────────────
BEGIN;

-- ── Yeni enum tipleri ──
CREATE TYPE "ExpertStatus"           AS ENUM ('PENDING_VERIFICATION', 'ACTIVE', 'WAITLISTED', 'SUSPENDED', 'CLOSED');
CREATE TYPE "ExpertVisibility"       AS ENUM ('HIDDEN', 'FEATURED', 'PAUSED', 'PROBATION');
CREATE TYPE "ExpertOverride"         AS ENUM ('FORCE_FEATURED', 'FORCE_PAUSED');
CREATE TYPE "ExpertNoteStatus"       AS ENUM ('PENDING', 'PUBLISHED', 'REJECTED', 'HIDDEN');
CREATE TYPE "AnswerStatus"           AS ENUM ('PENDING', 'PUBLISHED', 'REJECTED');
CREATE TYPE "ExpertContactEventKind" AS ENUM ('PROFILE_VIEW', 'CONTACT_REVEAL', 'MESSAGE_START', 'MESSAGE_REPLIED', 'THREAD_REACHED_DEPTH_3');
CREATE TYPE "ExpertPlacementSurface" AS ENUM ('VEHICLE_PAGE', 'EXPERT_PROFILE', 'REGIONAL_BLOCK', 'MODEL_TAB', 'SEARCH');
CREATE TYPE "PlacementReason"        AS ENUM ('EARNED', 'SPONSORED', 'EDITORIAL_PICK');
CREATE TYPE "SponsorshipKind"        AS ENUM ('SPONSORED_EXPERT', 'APPROVED_SERVICE');
CREATE TYPE "SponsorshipStatus"      AS ENUM ('PENDING_PAYMENT', 'ACTIVE', 'EXPIRED', 'CANCELLED');
CREATE TYPE "TakedownClaimantType"   AS ENUM ('MANUFACTURER', 'BRAND_REP', 'AUTHORIZED_SERVICE', 'THIRD_PARTY', 'LEGAL_COUNSEL', 'OTHER');
CREATE TYPE "TakedownReason"         AS ENUM ('DEFAMATION', 'FACTUAL_INACCURACY', 'IP_INFRINGEMENT', 'PERSONAL_DATA', 'IMPERSONATION', 'OTHER');
CREATE TYPE "TakedownRemedy"         AS ENUM ('REMOVAL', 'CORRECTION', 'RIGHT_OF_REPLY');
CREATE TYPE "TakedownStatus"         AS ENUM ('RECEIVED', 'AWAITING_CLAIMANT_INFO', 'UNDER_REVIEW', 'INTERIM_HIDDEN', 'RESOLVED_REMOVED', 'RESOLVED_CORRECTED', 'RESOLVED_REJECTED', 'RESOLVED_REPLY_GRANTED', 'WITHDRAWN');
CREATE TYPE "TakedownDecision"       AS ENUM ('REMOVED', 'CORRECTED', 'REJECTED', 'REPLY_GRANTED');
CREATE TYPE "TakedownAppealStatus"   AS ENUM ('NONE', 'PENDING', 'UPHELD', 'OVERTURNED');
CREATE TYPE "TakedownAppellant"      AS ENUM ('CLAIMANT', 'EXPERT');
CREATE TYPE "ExpertReplyStatus"      AS ENUM ('PENDING', 'PUBLISHED', 'REJECTED');


-- ── expert_profiles ──
CREATE TABLE "expert_profiles" (
    "id"                  SERIAL           NOT NULL,
    "userId"              INTEGER          NOT NULL,
    "slug"                TEXT             NOT NULL,
    "headline"            VARCHAR(120),
    "bio"                 VARCHAR(2000),
    "photoUrl"            TEXT,
    "city"                VARCHAR(50),
    "district"            VARCHAR(60),
    "expertiseTags"       TEXT[]           NOT NULL DEFAULT ARRAY[]::TEXT[],
    "contactPhone"        VARCHAR(20),
    "contactAddress"      VARCHAR(300),
    "contactVisible"      BOOLEAN          NOT NULL DEFAULT false,
    "cvNoindex"           BOOLEAN          NOT NULL DEFAULT false,
    "status"              "ExpertStatus"   NOT NULL DEFAULT 'PENDING_VERIFICATION',
    "verifiedAt"          TIMESTAMP(3),
    "verifiedBy"          INTEGER,
    "visibilityState"     "ExpertVisibility" NOT NULL DEFAULT 'HIDDEN',
    "graceUntil"          TIMESTAMP(3),
    "lastScoredAt"        TIMESTAMP(3),
    "currentPeriodScore"  DOUBLE PRECISION,
    "adminOverride"       "ExpertOverride",
    "sponsoredUntilCache" TIMESTAMP(3),
    "createdAt"           TIMESTAMP(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"           TIMESTAMP(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "expert_profiles_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "expert_profiles_userId_key" ON "expert_profiles" ("userId");
CREATE UNIQUE INDEX "expert_profiles_slug_key" ON "expert_profiles" ("slug");
CREATE INDEX "expert_profiles_status_visibilityState_idx" ON "expert_profiles" ("status", "visibilityState");
CREATE INDEX "expert_profiles_city_visibilityState_idx" ON "expert_profiles" ("city", "visibilityState");
ALTER TABLE "expert_profiles" ADD CONSTRAINT "expert_profiles_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- ── expert_notes ──
CREATE TABLE "expert_notes" (
    "id"                   SERIAL             NOT NULL,
    "profileId"            INTEGER            NOT NULL,
    "modelId"              INTEGER            NOT NULL,
    "title"                VARCHAR(140)       NOT NULL,
    "body"                 TEXT               NOT NULL,
    "structured"           JSONB              NOT NULL DEFAULT '{}',
    "status"               "ExpertNoteStatus" NOT NULL DEFAULT 'PENDING',
    "qualityScore"         INTEGER,
    "approvedQualityScore" INTEGER,
    "publishedAt"          TIMESTAMP(3),
    "rejectedAt"           TIMESTAMP(3),
    "rejectionReason"      VARCHAR(300),
    "removedAt"            TIMESTAMP(3),
    "editedAt"             TIMESTAMP(3),
    "editCount"            INTEGER            NOT NULL DEFAULT 0,
    "createdAt"            TIMESTAMP(3)       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"            TIMESTAMP(3)       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "expert_notes_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "expert_notes_modelId_status_idx" ON "expert_notes" ("modelId", "status");
CREATE INDEX "expert_notes_profileId_status_idx" ON "expert_notes" ("profileId", "status");
ALTER TABLE "expert_notes" ADD CONSTRAINT "expert_notes_profileId_fkey"
    FOREIGN KEY ("profileId") REFERENCES "expert_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "expert_notes" ADD CONSTRAINT "expert_notes_modelId_fkey"
    FOREIGN KEY ("modelId") REFERENCES "models"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- ── expert_note_votes ──
CREATE TABLE "expert_note_votes" (
    "id"             SERIAL       NOT NULL,
    "noteId"         INTEGER      NOT NULL,
    "userId"         INTEGER      NOT NULL,
    "isHelpful"      BOOLEAN      NOT NULL,
    "voteConfidence" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "expert_note_votes_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "expert_note_votes_noteId_userId_key" ON "expert_note_votes" ("noteId", "userId");
ALTER TABLE "expert_note_votes" ADD CONSTRAINT "expert_note_votes_noteId_fkey"
    FOREIGN KEY ("noteId") REFERENCES "expert_notes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "expert_note_votes" ADD CONSTRAINT "expert_note_votes_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- ── expert_note_versions ──
CREATE TABLE "expert_note_versions" (
    "id"                   SERIAL       NOT NULL,
    "noteId"               INTEGER      NOT NULL,
    "version"              INTEGER      NOT NULL,
    "title"                TEXT         NOT NULL,
    "body"                 TEXT         NOT NULL,
    "structured"           JSONB        NOT NULL DEFAULT '{}',
    "approvedQualityScore" INTEGER,
    "createdAt"            TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "expert_note_versions_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "expert_note_versions_noteId_version_key" ON "expert_note_versions" ("noteId", "version");
ALTER TABLE "expert_note_versions" ADD CONSTRAINT "expert_note_versions_noteId_fkey"
    FOREIGN KEY ("noteId") REFERENCES "expert_notes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- ── expert_score_snapshots ──
CREATE TABLE "expert_score_snapshots" (
    "id"                        SERIAL             NOT NULL,
    "profileId"                 INTEGER            NOT NULL,
    "period"                    VARCHAR(7)         NOT NULL,
    "distinctModelQualityNotes" INTEGER            NOT NULL,
    "qualityAvgNorm"            DOUBLE PRECISION   NOT NULL,
    "helpfulWilson"             DOUBLE PRECISION   NOT NULL,
    "voterDiversity"            DOUBLE PRECISION   NOT NULL,
    "reportRate"                DOUBLE PRECISION   NOT NULL,
    "penalties"                 DOUBLE PRECISION   NOT NULL,
    "rawScore"                  DOUBLE PRECISION   NOT NULL,
    "decision"                  "ExpertVisibility" NOT NULL,
    "wasSponsored"              BOOLEAN            NOT NULL DEFAULT false,
    "placementImpressions"      INTEGER            NOT NULL DEFAULT 0,
    "createdAt"                 TIMESTAMP(3)       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "expert_score_snapshots_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "expert_score_snapshots_profileId_period_key" ON "expert_score_snapshots" ("profileId", "period");
ALTER TABLE "expert_score_snapshots" ADD CONSTRAINT "expert_score_snapshots_profileId_fkey"
    FOREIGN KEY ("profileId") REFERENCES "expert_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- ── expert_override_events ──
CREATE TABLE "expert_override_events" (
    "id"         SERIAL             NOT NULL,
    "profileId"  INTEGER            NOT NULL,
    "period"     VARCHAR(7)         NOT NULL,
    "fromState"  "ExpertVisibility" NOT NULL,
    "toState"    "ExpertVisibility" NOT NULL,
    "reasonCode" VARCHAR(40)        NOT NULL,
    "adminId"    INTEGER            NOT NULL,
    "createdAt"  TIMESTAMP(3)       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "expert_override_events_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "expert_override_events" ADD CONSTRAINT "expert_override_events_profileId_fkey"
    FOREIGN KEY ("profileId") REFERENCES "expert_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- ── expert_contact_events ──
CREATE TABLE "expert_contact_events" (
    "id"              SERIAL                   NOT NULL,
    "profileId"       INTEGER                  NOT NULL,
    "kind"            "ExpertContactEventKind" NOT NULL,
    "surface"         "ExpertPlacementSurface" NOT NULL,
    "placementReason" "PlacementReason"        NOT NULL,
    "regionBucket"    VARCHAR(40)              NOT NULL,
    "dedupeKey"       VARCHAR(64)              NOT NULL,
    "createdAt"       TIMESTAMP(3)             NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "expert_contact_events_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "expert_contact_events_profileId_createdAt_idx" ON "expert_contact_events" ("profileId", "createdAt");
ALTER TABLE "expert_contact_events" ADD CONSTRAINT "expert_contact_events_profileId_fkey"
    FOREIGN KEY ("profileId") REFERENCES "expert_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- ── expert_region_stats ──
CREATE TABLE "expert_region_stats" (
    "id"               SERIAL       NOT NULL,
    "period"           VARCHAR(7)   NOT NULL,
    "regionBucket"     VARCHAR(40)  NOT NULL,
    "expertCount"      INTEGER      NOT NULL,
    "featuredCount"    INTEGER      NOT NULL,
    "noteCount"        INTEGER      NOT NULL,
    "contactEventCount" INTEGER     NOT NULL,
    "modelsCovered"    INTEGER      NOT NULL,
    "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "expert_region_stats_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "expert_region_stats_period_regionBucket_key" ON "expert_region_stats" ("period", "regionBucket");


-- ── expert_sponsorships ──
CREATE TABLE "expert_sponsorships" (
    "id"                 SERIAL              NOT NULL,
    "profileId"          INTEGER             NOT NULL,
    "kind"               "SponsorshipKind"   NOT NULL,
    "status"             "SponsorshipStatus" NOT NULL DEFAULT 'PENDING_PAYMENT',
    "startsAt"           TIMESTAMP(3),
    "endsAt"             TIMESTAMP(3),
    "scopeCities"        TEXT[]              NOT NULL DEFAULT ARRAY[]::TEXT[],
    "scopeDistricts"     TEXT[]              NOT NULL DEFAULT ARRAY[]::TEXT[],
    "scopeModelIds"      INTEGER[]           NOT NULL DEFAULT ARRAY[]::INTEGER[],
    "soldByAdminId"      INTEGER,
    "priceMinorUnits"    INTEGER,
    "currency"           VARCHAR(3),
    "externalInvoiceRef" TEXT,
    "paymentStatus"      VARCHAR(24),
    "assessedAt"         TIMESTAMP(3),
    "assessedBy"         INTEGER,
    "expiresAt"          TIMESTAMP(3),
    "revokedAt"          TIMESTAMP(3),
    "note"               TEXT,
    "createdAt"          TIMESTAMP(3)        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"          TIMESTAMP(3)        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "expert_sponsorships_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "expert_sponsorships_profileId_status_idx" ON "expert_sponsorships" ("profileId", "status");
ALTER TABLE "expert_sponsorships" ADD CONSTRAINT "expert_sponsorships_profileId_fkey"
    FOREIGN KEY ("profileId") REFERENCES "expert_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- ── expert_note_takedown_requests ──
CREATE TABLE "expert_note_takedown_requests" (
    "id"                   SERIAL                 NOT NULL,
    "noteId"               INTEGER                NOT NULL,
    "noteVersionAtRequest" INTEGER,
    "claimantType"         "TakedownClaimantType" NOT NULL,
    "claimantName"         VARCHAR(160)           NOT NULL,
    "claimantOrg"          VARCHAR(200),
    "claimantEmail"        VARCHAR(200)           NOT NULL,
    "claimantPhone"        VARCHAR(30),
    "claimantUserId"       INTEGER,
    "authorityVerified"    BOOLEAN                NOT NULL DEFAULT false,
    "authorityNote"        VARCHAR(300),
    "reasonCategory"       "TakedownReason"       NOT NULL,
    "requestedRemedy"      "TakedownRemedy"       NOT NULL,
    "statement"            TEXT                   NOT NULL,
    "evidenceUrls"         TEXT[]                 NOT NULL DEFAULT ARRAY[]::TEXT[],
    "status"               "TakedownStatus"       NOT NULL DEFAULT 'RECEIVED',
    "acknowledgedAt"       TIMESTAMP(3),
    "interimHiddenAt"      TIMESTAMP(3),
    "expertNotifiedAt"     TIMESTAMP(3),
    "reviewDueAt"          TIMESTAMP(3),
    "decision"             "TakedownDecision",
    "decisionReason"       VARCHAR(600),
    "decidedBy"            INTEGER,
    "decidedAt"            TIMESTAMP(3),
    "appealStatus"         "TakedownAppealStatus" NOT NULL DEFAULT 'NONE',
    "appealFiledBy"        "TakedownAppellant",
    "appealReason"         VARCHAR(600),
    "appealFiledAt"        TIMESTAMP(3),
    "appealDecidedBy"      INTEGER,
    "appealDecidedAt"      TIMESTAMP(3),
    "createdAt"            TIMESTAMP(3)           NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"            TIMESTAMP(3)           NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "expert_note_takedown_requests_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "expert_note_takedown_requests_noteId_status_idx" ON "expert_note_takedown_requests" ("noteId", "status");
CREATE INDEX "expert_note_takedown_requests_status_reviewDueAt_idx" ON "expert_note_takedown_requests" ("status", "reviewDueAt");
ALTER TABLE "expert_note_takedown_requests" ADD CONSTRAINT "expert_note_takedown_requests_noteId_fkey"
    FOREIGN KEY ("noteId") REFERENCES "expert_notes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "expert_note_takedown_requests" ADD CONSTRAINT "expert_note_takedown_requests_claimantUserId_fkey"
    FOREIGN KEY ("claimantUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;


-- ── expert_note_external_replies ──
CREATE TABLE "expert_note_external_replies" (
    "id"                   SERIAL              NOT NULL,
    "takedownId"           INTEGER             NOT NULL,
    "noteId"               INTEGER             NOT NULL,
    "authorLabel"          VARCHAR(120)        NOT NULL,
    "body"                 VARCHAR(800)        NOT NULL,
    "status"               "ExpertReplyStatus" NOT NULL DEFAULT 'PENDING',
    "expertRebuttal"       VARCHAR(800),
    "expertRebuttalStatus" "ExpertReplyStatus",
    "publishedAt"          TIMESTAMP(3),
    "createdAt"            TIMESTAMP(3)        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"            TIMESTAMP(3)        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "expert_note_external_replies_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "expert_note_external_replies_takedownId_key" ON "expert_note_external_replies" ("takedownId");
CREATE INDEX "expert_note_external_replies_noteId_status_idx" ON "expert_note_external_replies" ("noteId", "status");
ALTER TABLE "expert_note_external_replies" ADD CONSTRAINT "expert_note_external_replies_takedownId_fkey"
    FOREIGN KEY ("takedownId") REFERENCES "expert_note_takedown_requests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "expert_note_external_replies" ADD CONSTRAINT "expert_note_external_replies_noteId_fkey"
    FOREIGN KEY ("noteId") REFERENCES "expert_notes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- ── questions: Product'a bağlılık opsiyonel + not-altı Q&A hedefi ──
-- Mevcut tüm satırlar productId dolu → CHECK'i geçer.
ALTER TABLE "questions" ALTER COLUMN "productId" DROP NOT NULL;
ALTER TABLE "questions" ADD COLUMN "expertNoteId" INTEGER;
CREATE INDEX "questions_expertNoteId_idx" ON "questions" ("expertNoteId");
ALTER TABLE "questions" ADD CONSTRAINT "questions_expertNoteId_fkey"
    FOREIGN KEY ("expertNoteId") REFERENCES "expert_notes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "questions" ADD CONSTRAINT "questions_target_xor"
    CHECK (("productId" IS NOT NULL) <> ("expertNoteId" IS NOT NULL));


-- ── answers: not-altı Q&A moderasyonu ──
-- Yeni kolon DEFAULT 'PUBLISHED' → mevcut araç-sayfası cevapları görünür kalır (geriye uyum).
-- Not-altı Q&A API'si yeni cevapları açıkça 'PENDING' yazar.
ALTER TABLE "answers" ADD COLUMN "status" "AnswerStatus" NOT NULL DEFAULT 'PUBLISHED';
ALTER TABLE "answers" ADD COLUMN "answeredByExpertProfileId" INTEGER;
-- (answeredByExpertProfileId için FK yok — Prisma şemasında ilişki tanımlı değil,
--  uygulama katmanı doğrular. İstenirse ileride eklenebilir.)


-- ── content_reports: EXPERT_NOTE hedefi ──
-- Mevcut satırlar: targetType ≠ EXPERT_NOTE, expertNoteId NULL, productId dolu → CHECK'i geçer.
ALTER TABLE "content_reports" ALTER COLUMN "productId" DROP NOT NULL;
ALTER TABLE "content_reports" ADD COLUMN "expertNoteId" INTEGER;
ALTER TABLE "content_reports" ADD CONSTRAINT "content_reports_expertNoteId_fkey"
    FOREIGN KEY ("expertNoteId") REFERENCES "expert_notes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "content_reports" ADD CONSTRAINT "content_reports_target_shape"
    CHECK (("targetType" = 'EXPERT_NOTE') = ("expertNoteId" IS NOT NULL AND "productId" IS NULL));


-- ── consent_logs: rıza metni sürümü ──
ALTER TABLE "consent_logs" ADD COLUMN "consentVersion" TEXT;

COMMIT;
