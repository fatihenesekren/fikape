-- Migration: takasa açma uygunluğu ve /takas listesi için indeksler
-- Run this in Supabase SQL Editor (güvenli: IF NOT EXISTS, veri değişmez, yeniden çalıştırılabilir)
--
-- Neden: lib/takasUygunluk.ts her Garajım açılışında ve her ilan açma/yeniden açma
-- isteğinde reviews'i userId/userProductId ile, product_photos'u reviewId ile
-- filtreliyor; bu kolonlarda indeks yoktu. Tablolar küçükken fark yaratmaz,
-- yorum/fotoğraf sayısı büyüdükçe tam tablo taramasını önler. trade_listings
-- indeksi /takas listesinin "aktif ilanlar, en yeni önce" sorgusu içindir.

CREATE INDEX IF NOT EXISTS "reviews_user_status_idx" ON "reviews" ("userId", "status");
CREATE INDEX IF NOT EXISTS "reviews_user_product_status_idx" ON "reviews" ("userProductId", "status");
CREATE INDEX IF NOT EXISTS "product_photos_review_status_idx" ON "product_photos" ("reviewId", "status");
CREATE INDEX IF NOT EXISTS "trade_listings_active_effective_idx" ON "trade_listings" ("isActive", "effectiveDate");
