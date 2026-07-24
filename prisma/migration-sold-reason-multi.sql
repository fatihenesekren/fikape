-- Migration: soldReason tekil string'ten array'e, + soldReasonNote (Diğer serbest metin)
-- Run this in Supabase SQL Editor

ALTER TABLE user_products
  ALTER COLUMN "soldReason" TYPE TEXT[] USING (
    CASE WHEN "soldReason" IS NULL THEN ARRAY[]::TEXT[] ELSE ARRAY["soldReason"] END
  );

ALTER TABLE user_products
  ALTER COLUMN "soldReason" SET DEFAULT ARRAY[]::TEXT[];

ALTER TABLE user_products
  ALTER COLUMN "soldReason" SET NOT NULL;

ALTER TABLE user_products
  ADD COLUMN IF NOT EXISTS "soldReasonNote" VARCHAR(200);
