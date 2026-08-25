-- Takas ilanı "aradığım araç nerede olsun / hangi hasar durumlarını kabul
-- ederim" beklentileri (bkz. feature_takas_ilan_konum_hasar_beklentisi memory'si).

-- CreateEnum
CREATE TYPE "TradeLocationScope" AS ENUM ('SAME_CITY', 'SAME_REGION', 'NATIONWIDE');

-- AlterTable
ALTER TABLE "trade_listings" ADD COLUMN     "wantDamageStatuses" "TradeDamageStatus"[] DEFAULT ARRAY[]::"TradeDamageStatus"[],
ADD COLUMN     "wantLocationScope" "TradeLocationScope" NOT NULL DEFAULT 'NATIONWIDE';
