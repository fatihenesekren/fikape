-- Migration: Haftalık görüntülenme anlık görüntüsü
-- reset-weekly-views cron'u weeklyViewCount'u sıfırlamadan HEMEN ÖNCE bu tabloya
-- yazar; haftalık admin raporu top-10 + WoW görüntüleme farkı için bunu okur.
-- Run this in Supabase SQL Editor

CREATE TABLE "weekly_view_snapshots" (
  "id"            SERIAL       PRIMARY KEY,
  "weekStart"     TIMESTAMP(3) NOT NULL,
  "productId"     INTEGER      NOT NULL REFERENCES "products"("id") ON DELETE CASCADE,
  "weeklyViews"   INTEGER      NOT NULL DEFAULT 0,
  "lifetimeViews" INTEGER      NOT NULL DEFAULT 0,
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX "weekly_view_snapshots_weekStart_productId_key"
  ON "weekly_view_snapshots" ("weekStart", "productId");
CREATE INDEX "weekly_view_snapshots_weekStart_idx"
  ON "weekly_view_snapshots" ("weekStart");
