-- Yorum paylaşım rızası (REVIEW_DATA_SHARING) — ConsentType enum'una yeni değer.
-- Supabase SQL Editor'de çalıştırın; tekrar çalıştırılabilir (IF NOT EXISTS).
ALTER TYPE "ConsentType" ADD VALUE IF NOT EXISTS 'REVIEW_DATA_SHARING';
