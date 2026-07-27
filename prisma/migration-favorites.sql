-- Migration: Favori araç özelliği (Faz 1)
-- Run this in Supabase SQL Editor

CREATE TABLE "favorites" (
  "id"        SERIAL PRIMARY KEY,
  "userId"    INTEGER NOT NULL REFERENCES "users"("id"),
  "productId" INTEGER NOT NULL REFERENCES "products"("id"),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX "favorites_userId_productId_key" ON "favorites"("userId", "productId");
