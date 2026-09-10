-- Migration: Arama sorgu logu — sıfır-sonuç ("kataloğa aday") + popüler terim analizi
-- Kişisel veri YOK: sadece normalize edilmiş terim + sonuç sayısı + kaynak.
-- userId / IP / session tutulmaz. 90 günden eski satırlar haftalık rapor
-- cron'unda temizlenir.
-- Run this in Supabase SQL Editor

CREATE TABLE "search_query_logs" (
  "id"          SERIAL       PRIMARY KEY,
  "term"        VARCHAR(200) NOT NULL,   -- trim + küçük harf + boşluk sadeleştirilmiş
  "resultCount" INTEGER      NOT NULL,
  "source"      VARCHAR(16)  NOT NULL,   -- "arama" | "araclar"
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "search_query_logs_createdAt_idx" ON "search_query_logs" ("createdAt");
CREATE INDEX "search_query_logs_resultCount_createdAt_idx" ON "search_query_logs" ("resultCount", "createdAt");
