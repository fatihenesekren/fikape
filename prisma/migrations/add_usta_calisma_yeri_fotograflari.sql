-- ═══════════════════════════════════════════════════════════════════
-- USTA GÖRÜŞLERİ — Çalışma Yeri Fotoğrafları (tabela + iç mekan slider'ı)
--
-- Supabase SQL Editor'de çalıştırın. Bölüm A (enum ADD VALUE) ÖNCE ve TEK
-- BAŞINA, sonra Bölüm B.
-- ═══════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────
-- BÖLÜM A
-- ─────────────────────────────────────────────────────────────────
BEGIN;

ALTER TYPE "ConsentType" ADD VALUE IF NOT EXISTS 'EXPERT_WORKPLACE_PHOTO';
ALTER TYPE "ContentReportTargetType" ADD VALUE IF NOT EXISTS 'EXPERT_WORKPLACE_PHOTO';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'ADMIN_NEW_EXPERT_WORKPLACE_PHOTO';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'EXPERT_WORKPLACE_PHOTO_MODERATED';

COMMIT;


-- ─────────────────────────────────────────────────────────────────
-- BÖLÜM B
-- ─────────────────────────────────────────────────────────────────
BEGIN;

CREATE TYPE "WorkplacePhotoKind" AS ENUM ('STOREFRONT', 'INTERIOR');

CREATE TABLE "expert_workplace_photos" (
    "id"        SERIAL              NOT NULL,
    "profileId" INTEGER             NOT NULL,
    "url"       TEXT                NOT NULL,
    "kind"      "WorkplacePhotoKind" NOT NULL,
    "status"    "PhotoStatus"       NOT NULL DEFAULT 'PENDING',
    "order"     INTEGER             NOT NULL DEFAULT 0,
    "phash"     TEXT,
    "createdAt" TIMESTAMP(3)        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "expert_workplace_photos_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "expert_workplace_photos_profileId_status_idx" ON "expert_workplace_photos" ("profileId", "status");
ALTER TABLE "expert_workplace_photos" ADD CONSTRAINT "expert_workplace_photos_profileId_fkey"
    FOREIGN KEY ("profileId") REFERENCES "expert_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "content_reports" ADD COLUMN "workplacePhotoId" INTEGER;
ALTER TABLE "content_reports" ADD CONSTRAINT "content_reports_workplacePhotoId_fkey"
    FOREIGN KEY ("workplacePhotoId") REFERENCES "expert_workplace_photos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

COMMIT;
