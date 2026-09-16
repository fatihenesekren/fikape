-- Migration: Trafik logu — 5651 sayılı Kanun m.5 "yer sağlayıcı" yükümlülüğü.
-- Sadece kritik "işlem" route'ları loglanır (kayıt, giriş, yorum/ilan/mesaj
-- oluşturma), genel sayfa görüntülemesi hariç. ipAddress AES-256-GCM ile
-- ŞİFRELİ tutulur (bkz. src/lib/security.ts encryptIp/decryptIp) — yasal
-- talep halinde çözülebilir, ama DB tek başına sızarsa okunamaz. Query
-- string ve request body tutulmaz. 2 yıldan eski satırlar cron ile silinir
-- (bkz. api/cron/cleanup-access-logs).
-- Run this in Supabase SQL Editor

CREATE TABLE "access_logs" (
  "id"        SERIAL       PRIMARY KEY,
  "userId"    INTEGER      REFERENCES "users"("id") ON DELETE SET NULL,
  "ipAddress" VARCHAR(255) NOT NULL, -- AES-256-GCM şifreli (iv+tag+ciphertext, base64)
  "userAgent" VARCHAR(255),
  "method"    VARCHAR(8)   NOT NULL,
  "path"      VARCHAR(255) NOT NULL,
  "action"    VARCHAR(32)  NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "access_logs_createdAt_idx" ON "access_logs" ("createdAt");
CREATE INDEX "access_logs_userId_createdAt_idx" ON "access_logs" ("userId", "createdAt");
