-- Katalog görseli atıf bilgisi (yazar + lisans). Yalnız ADD COLUMN; mevcut veriye dokunmaz.
-- Supabase SQL Editor'den elle çalıştırılır.
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "imageCredit" JSONB;
