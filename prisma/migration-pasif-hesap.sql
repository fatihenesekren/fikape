-- Pasif hesap otomasyonu (24 ay giriş yok → uyarı → askıya alma). Yalnız ADD COLUMN + dolgu + indeks; mevcut veriyi silmez.
-- Supabase SQL Editor'den elle çalıştırılır. KOD DAĞITILMADAN ÖNCE çalıştırılmalıdır.
ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "lastActiveAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "inactiveWarnedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "inactiveSuspendedAt" TIMESTAMP(3);

-- Mevcut üyeler için son etkinlik: son başarılı giriş kaydı, yoksa kayıt tarihi.
UPDATE "users" u
SET "lastActiveAt" = COALESCE(
  (SELECT MAX(a."createdAt") FROM "access_logs" a WHERE a."userId" = u."id" AND a."action" = 'LOGIN'),
  u."createdAt"
)
WHERE u."lastActiveAt" IS NULL;

CREATE INDEX IF NOT EXISTS "users_lastActiveAt_idx" ON "users" ("lastActiveAt");
