-- Migration: "Bu araç zaten var mı" sorgusu ve yorum sayımı için indeksler
-- Run this in Supabase SQL Editor (güvenli: IF NOT EXISTS, veri değişmez, yeniden çalıştırılabilir)
-- Tablolar küçükken fark yaratmaz; katalog/yorum sayısı büyüdükçe tam tablo taramasını önler.

CREATE INDEX IF NOT EXISTS "products_model_status_idx" ON "products" ("modelId", "status");
CREATE INDEX IF NOT EXISTS "reviews_product_status_idx" ON "reviews" ("productId", "status");
