-- Boyalı veya Değişen Parça sekmesi — ilana bağlı parça durumu kaydı.

CREATE TYPE "PartCondition" AS ENUM ('ORIGINAL', 'LOCAL_PAINT', 'PAINTED', 'REPLACED');

CREATE TABLE "trade_listing_part_conditions" (
    "id" SERIAL NOT NULL,
    "tradeListingId" INTEGER NOT NULL,
    "partKey" VARCHAR(50) NOT NULL,
    "condition" "PartCondition" NOT NULL,

    CONSTRAINT "trade_listing_part_conditions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "trade_listing_part_conditions_tradeListingId_partKey_key"
    ON "trade_listing_part_conditions" ("tradeListingId", "partKey");

ALTER TABLE "trade_listing_part_conditions" ADD CONSTRAINT "trade_listing_part_conditions_tradeListingId_fkey"
    FOREIGN KEY ("tradeListingId") REFERENCES "trade_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
