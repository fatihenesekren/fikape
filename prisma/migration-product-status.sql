-- Migration: Product status + VehicleSuggestion.productId
-- Run this in Supabase SQL Editor

CREATE TYPE "ProductStatus" AS ENUM ('PENDING', 'ACTIVE', 'REJECTED');

ALTER TABLE products
  ADD COLUMN status "ProductStatus" NOT NULL DEFAULT 'ACTIVE';

ALTER TABLE vehicle_suggestions
  ADD COLUMN "productId" INTEGER REFERENCES products(id) ON DELETE SET NULL;

ALTER TABLE vehicle_suggestions
  ADD COLUMN IF NOT EXISTS "photoUrls" TEXT[] NOT NULL DEFAULT '{}';

CREATE TYPE "SuggestionStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

ALTER TABLE vehicle_suggestions
  ADD COLUMN IF NOT EXISTS "status" "SuggestionStatus" NOT NULL DEFAULT 'PENDING';

ALTER TABLE vehicle_suggestions
  ADD COLUMN IF NOT EXISTS "adminNote" TEXT;

ALTER TABLE vehicle_suggestions
  ADD COLUMN IF NOT EXISTS "reviewedAt" TIMESTAMP(3);

ALTER TABLE vehicle_suggestions
  ADD COLUMN IF NOT EXISTS "reviewedBy" INTEGER;
