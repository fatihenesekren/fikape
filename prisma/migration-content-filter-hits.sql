-- Migration: İçerik filtresi izi (IBAN/telefon/e-posta/link engellenen gönderimler)
-- Run this in Supabase SQL Editor

CREATE TABLE "content_filter_hits" (
  "id"        SERIAL PRIMARY KEY,
  "userId"    INTEGER NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "surface"   VARCHAR(24) NOT NULL,
  "rule"      VARCHAR(24) NOT NULL,
  "threadId"  INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "content_filter_hits_userId_createdAt_idx" ON "content_filter_hits"("userId", "createdAt");
CREATE INDEX "content_filter_hits_createdAt_idx" ON "content_filter_hits"("createdAt");
