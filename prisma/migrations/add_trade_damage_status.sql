-- Hasar Durumu sekmesi — genel hasar durumu, motor/şanzıman/yürüyen aksam
-- durumu ve tramer kayıtları (bkz. backlog_takas_hasar_durumu_sekmesi memory'si).

-- CreateEnum
CREATE TYPE "TradeDamageStatus" AS ENUM ('NONE', 'DAMAGED', 'HEAVY');

-- CreateEnum
CREATE TYPE "MechanicalCondition" AS ENUM ('ORIGINAL', 'MINOR_FIXED', 'REPLACED_OEM', 'REPLACED_AFTERMARKET', 'ONGOING_ISSUE');

-- AlterTable
ALTER TABLE "trade_listings" ADD COLUMN     "damageStatus" "TradeDamageStatus",
ADD COLUMN     "engineCondition" "MechanicalCondition",
ADD COLUMN     "engineNote" VARCHAR(300),
ADD COLUMN     "runningGearCondition" "MechanicalCondition",
ADD COLUMN     "runningGearNote" VARCHAR(300),
ADD COLUMN     "transmissionCondition" "MechanicalCondition",
ADD COLUMN     "transmissionNote" VARCHAR(300);

-- CreateTable
CREATE TABLE "trade_tramer_records" (
    "id" SERIAL NOT NULL,
    "tradeListingId" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "trade_tramer_records_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "trade_tramer_records_tradeListingId_idx" ON "trade_tramer_records"("tradeListingId");

-- AddForeignKey
ALTER TABLE "trade_tramer_records" ADD CONSTRAINT "trade_tramer_records_tradeListingId_fkey" FOREIGN KEY ("tradeListingId") REFERENCES "trade_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
