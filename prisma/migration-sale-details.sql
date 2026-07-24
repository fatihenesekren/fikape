-- Migration: UserProduct satış detayı (fiyat + takas bilgisi)
-- Run this in Supabase SQL Editor

CREATE TYPE "SaleType" AS ENUM ('CASH', 'TRADE');
CREATE TYPE "TradeExtraDirection" AS ENUM ('PAID_EXTRA', 'RECEIVED_EXTRA', 'EVEN');

ALTER TABLE user_products
  ADD COLUMN IF NOT EXISTS "saleType" "SaleType",
  ADD COLUMN IF NOT EXISTS "salePrice" INTEGER,
  ADD COLUMN IF NOT EXISTS "tradeExtraDirection" "TradeExtraDirection",
  ADD COLUMN IF NOT EXISTS "tradeExtraAmount" INTEGER;
