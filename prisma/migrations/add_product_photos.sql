-- Migration: ProductPhoto tablosu + VehicleSuggestion yeni alanlar

-- 1. PhotoStatus enum
CREATE TYPE "PhotoStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- 2. VehicleSuggestion'a yeni alanlar
ALTER TABLE "vehicle_suggestions"
  ADD COLUMN "carQueryData" JSONB,
  ADD COLUMN "reviewData"   JSONB,
  ADD COLUMN "photoUrls"    TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

-- 3. ProductPhoto tablosu
CREATE TABLE "product_photos" (
  "id"               SERIAL       NOT NULL,
  "productId"        INTEGER      NOT NULL,
  "uploadedByUserId" INTEGER,
  "reviewId"         INTEGER,
  "url"              TEXT         NOT NULL,
  "status"           "PhotoStatus" NOT NULL DEFAULT 'PENDING',
  "order"            INTEGER      NOT NULL DEFAULT 0,
  "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "product_photos_pkey" PRIMARY KEY ("id")
);

-- 4. Foreign key'ler
ALTER TABLE "product_photos"
  ADD CONSTRAINT "product_photos_productId_fkey"
    FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "product_photos"
  ADD CONSTRAINT "product_photos_uploadedByUserId_fkey"
    FOREIGN KEY ("uploadedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "product_photos"
  ADD CONSTRAINT "product_photos_reviewId_fkey"
    FOREIGN KEY ("reviewId") REFERENCES "reviews"("id") ON DELETE SET NULL ON UPDATE CASCADE;
