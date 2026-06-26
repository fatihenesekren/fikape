-- Migration: Product status + VehicleSuggestion.productId
-- Run this in Supabase SQL Editor

CREATE TYPE "ProductStatus" AS ENUM ('PENDING', 'ACTIVE', 'REJECTED');

ALTER TABLE products
  ADD COLUMN status "ProductStatus" NOT NULL DEFAULT 'ACTIVE';

ALTER TABLE vehicle_suggestions
  ADD COLUMN "productId" INTEGER REFERENCES products(id) ON DELETE SET NULL;
