-- Manuel migration — Supabase SQL Editor'de çalıştırılacak
-- Kapsam: "Bilinen ama dokunulmayan drift" temizliği (gap analizi artığı).
--
-- Kök neden: vehicle_suggestions.status kolonu DB'de TEXT olarak kalmış
-- (migration-product-status.sql'deki ADD COLUMN IF NOT EXISTS, kolon zaten
-- var olduğu için sessizce no-op olmuştu — enum tipi yaratıldı ama kolona
-- hiç bağlanmadı). prisma migrate diff'in önerdiği DROP COLUMN + ADD COLUMN
-- veriyi sıfırlayacağı için burada veri koruyan USING dönüşümü kullanılıyor.

-- 1) status: TEXT → SuggestionStatus enum (veri korunur)
ALTER TABLE "vehicle_suggestions" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "vehicle_suggestions"
  ALTER COLUMN "status" TYPE "SuggestionStatus" USING "status"::"SuggestionStatus";
ALTER TABLE "vehicle_suggestions"
  ALTER COLUMN "status" SET DEFAULT 'PENDING',
  ALTER COLUMN "status" SET NOT NULL;

-- 2) FK kural normalizasyonu — inline REFERENCES yazımı ON UPDATE NO ACTION
--    bırakmıştı; Prisma ON UPDATE CASCADE bekliyor. Davranışsal etki pratikte
--    sıfır (id'ler update edilmiyor), sadece drift'i kapatıyor.
ALTER TABLE "review_versions" DROP CONSTRAINT "review_versions_reviewId_fkey";
ALTER TABLE "review_versions"
  ADD CONSTRAINT "review_versions_reviewId_fkey"
  FOREIGN KEY ("reviewId") REFERENCES "reviews"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "vehicle_suggestions" DROP CONSTRAINT "vehicle_suggestions_userId_fkey";
ALTER TABLE "vehicle_suggestions"
  ADD CONSTRAINT "vehicle_suggestions_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "vehicle_suggestions" DROP CONSTRAINT "vehicle_suggestions_productId_fkey";
ALTER TABLE "vehicle_suggestions"
  ADD CONSTRAINT "vehicle_suggestions_productId_fkey"
  FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- 3) Timestamp hassasiyeti: timestamp(6) → timestamp(3) (kozmetik, Prisma standardı)
ALTER TABLE "reviews" ALTER COLUMN "editedAt" SET DATA TYPE TIMESTAMP(3);
ALTER TABLE "vehicle_suggestions" ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(3);
ALTER TABLE "vehicle_suggestions" ALTER COLUMN "reviewedAt" SET DATA TYPE TIMESTAMP(3);
