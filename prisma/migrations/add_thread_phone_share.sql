-- Takas görüşmesinde karşılıklı telefon paylaşımı.
-- Supabase SQL Editor'de çalıştırın. Enum eklemeleri IF NOT EXISTS'li; tablo/kolon da tekrar çalıştırılabilir.

ALTER TYPE "ConsentType" ADD VALUE IF NOT EXISTS 'TRADE_PHONE_SHARE';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'TRADE_PHONE_SHARED';

-- Rıza bağlamı (ör. "thread:123")
ALTER TABLE "consent_logs" ADD COLUMN IF NOT EXISTS "context" VARCHAR(40);

CREATE TABLE IF NOT EXISTS "thread_phone_shares" (
  "id"         SERIAL PRIMARY KEY,
  "threadId"   INTEGER NOT NULL REFERENCES "message_threads"("id") ON DELETE CASCADE,
  "userId"     INTEGER NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT,
  "phoneEnc"   TEXT NOT NULL,
  "phoneLast2" VARCHAR(2) NOT NULL,
  "phoneHash"  VARCHAR(64) NOT NULL,
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS "thread_phone_shares_threadId_userId_key" ON "thread_phone_shares"("threadId", "userId");
CREATE INDEX IF NOT EXISTS "thread_phone_shares_userId_idx" ON "thread_phone_shares"("userId");
CREATE INDEX IF NOT EXISTS "thread_phone_shares_phoneHash_idx" ON "thread_phone_shares"("phoneHash");
