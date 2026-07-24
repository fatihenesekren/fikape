-- Migration: kullanılmayan purchaseYear/ownershipMonths kolonlarını kaldır,
-- yerine purchasedAt + purchasePrice ekle
-- Run this in Supabase SQL Editor

ALTER TABLE user_products DROP COLUMN IF EXISTS "purchaseYear";
ALTER TABLE user_products DROP COLUMN IF EXISTS "ownershipMonths";

ALTER TABLE user_products ADD COLUMN IF NOT EXISTS "purchasedAt" TIMESTAMP(3);
ALTER TABLE user_products ADD COLUMN IF NOT EXISTS "purchasePrice" INTEGER;
