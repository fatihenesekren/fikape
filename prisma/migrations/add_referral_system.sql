-- Migration: Referral/davet sistemi — User.referralCode + referredByUserId

-- 1. Nullable olarak ekle
ALTER TABLE "users"
  ADD COLUMN "referralCode" TEXT,
  ADD COLUMN "referredByUserId" INTEGER;

-- 2. Mevcut kullanıcılar için kod üret (id bazlı, kısa ve benzersiz)
UPDATE "users" SET "referralCode" = 'FK' || LPAD("id"::text, 6, '0') WHERE "referralCode" IS NULL;

-- 3. NOT NULL + UNIQUE yap
ALTER TABLE "users" ALTER COLUMN "referralCode" SET NOT NULL;
CREATE UNIQUE INDEX "users_referralCode_key" ON "users"("referralCode");

-- 4. Foreign key
ALTER TABLE "users"
  ADD CONSTRAINT "users_referredByUserId_fkey"
    FOREIGN KEY ("referredByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
