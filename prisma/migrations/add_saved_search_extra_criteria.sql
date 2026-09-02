-- SavedSearch'e ödeme niyeti, yıl/km aralığı, yakıt/vites kriteri eklenmesi
-- için — önceden sadece city/categoryId/brandId saklanıyordu, kullanıcının
-- uyguladığı diğer filtreler "kaydet" derken sessizce yok sayılıyordu.

-- AlterTable
ALTER TABLE "saved_searches" ADD COLUMN     "criteriaKey" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "fuelTypes" "TradeFuelType"[] DEFAULT ARRAY[]::"TradeFuelType"[],
ADD COLUMN     "kmMax" INTEGER,
ADD COLUMN     "kmMin" INTEGER,
ADD COLUMN     "paymentIntent" "TradePaymentIntent",
ADD COLUMN     "transmissions" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "yearMax" INTEGER,
ADD COLUMN     "yearMin" INTEGER;

-- Mevcut kayıtlar için criteriaKey backfill — eski unique constraint zaten
-- (userId, city, categoryId, brandId) üzerinde tekildi, bu yüzden sadece bu
-- üç alanla üretilen key de aynı şekilde tekil olur (yeni alanların hepsi
-- eski kayıtlarda boş/null).
UPDATE "saved_searches"
SET "criteriaKey" = "city" || '|' || COALESCE("categoryId"::text, '') || '|' || COALESCE("brandId"::text, '') || '|||||||';

-- DropIndex
DROP INDEX "saved_searches_userId_city_categoryId_brandId_key";

-- CreateIndex
CREATE UNIQUE INDEX "saved_searches_userId_criteriaKey_key" ON "saved_searches"("userId", "criteriaKey");
