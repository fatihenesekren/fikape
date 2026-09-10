-- Migration: Haftalık admin rapor e-postası — tekrar gönderim koruması
-- Her ISO hafta için tek satır; cron çift-ateşlenirse / retry olursa ikinci
-- gönderim engellenir.
-- Run this in Supabase SQL Editor

CREATE TABLE "report_runs" (
  "id"             SERIAL       PRIMARY KEY,
  "kind"           VARCHAR(32)  NOT NULL,                    -- "weekly-admin"
  "isoWeek"        VARCHAR(10)  NOT NULL,                    -- "2026-W37" (raporlanan hafta)
  "status"         VARCHAR(12)  NOT NULL DEFAULT 'RUNNING',  -- RUNNING | SENT | FAILED
  "recipientCount" INTEGER,
  "summary"        TEXT,
  "error"          TEXT,
  "startedAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "finishedAt"     TIMESTAMP(3)
);

CREATE UNIQUE INDEX "report_runs_kind_isoWeek_key" ON "report_runs" ("kind", "isoWeek");
