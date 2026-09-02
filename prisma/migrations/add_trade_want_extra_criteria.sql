-- "Aradığınız Araç" bölümüne yıl aralığı, km aralığı, yakıt tipi ve vites
-- tipi beklentisi eklenmesi için.

-- CreateEnum
CREATE TYPE "TradeFuelType" AS ENUM ('GASOLINE', 'DIESEL', 'EV', 'PHEV', 'HYBRID', 'LPG');

-- AlterTable
ALTER TABLE "trade_listings" ADD COLUMN     "wantFuelTypes" "TradeFuelType"[] DEFAULT ARRAY[]::"TradeFuelType"[],
ADD COLUMN     "wantKmMax" INTEGER,
ADD COLUMN     "wantKmMin" INTEGER,
ADD COLUMN     "wantTransmissions" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "wantYearMax" INTEGER,
ADD COLUMN     "wantYearMin" INTEGER;
