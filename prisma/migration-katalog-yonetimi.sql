-- Katalog Yönetimi (admin): denetim kaydı, eski slug -> güncel kayıt tablosu, resmi katalog düzeltmeleri (gizleme).
-- Yalnız CREATE TABLE / CREATE INDEX içerir (DROP yok). Supabase SQL Editor'den elle çalıştırılır (bkz. OPERATIONS.md).
-- Bilinçli olarak FOREIGN KEY yok: denetim izi, silinen kullanıcı/ürün/marka için de kalmalı.

-- 1) Denetim kaydı (yalnız INSERT; uygulama UPDATE/DELETE yapmaz)
CREATE TABLE IF NOT EXISTS "catalog_audit_logs" (
  "id"          SERIAL PRIMARY KEY,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "adminId"     INTEGER,
  "adminLabel"  VARCHAR(160),
  "action"      VARCHAR(40)  NOT NULL,
  "entityType"  VARCHAR(16)  NOT NULL,
  "entityId"    INTEGER,
  "entityLabel" VARCHAR(240),
  "before"      JSONB,
  "after"       JSONB,
  "meta"        JSONB
);
CREATE INDEX IF NOT EXISTS "catalog_audit_logs_entity_idx"  ON "catalog_audit_logs" ("entityType", "entityId", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "catalog_audit_logs_created_idx" ON "catalog_audit_logs" ("createdAt" DESC);
CREATE INDEX IF NOT EXISTS "catalog_audit_logs_admin_idx"   ON "catalog_audit_logs" ("adminId");

-- 2) Eski slug -> güncel kayıt (marka/model yeniden adlandırma ve birleştirme sonrası 301 / eşleştirme)
CREATE TABLE IF NOT EXISTS "catalog_slug_aliases" (
  "id"        SERIAL PRIMARY KEY,
  "kind"      VARCHAR(8)   NOT NULL CHECK ("kind" IN ('BRAND', 'MODEL', 'PRODUCT')),
  "oldSlug"   VARCHAR(200) NOT NULL,
  "targetId"  INTEGER      NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "catalog_slug_aliases_kind_old_key" UNIQUE ("kind", "oldSlug")
);
CREATE INDEX IF NOT EXISTS "catalog_slug_aliases_target_idx" ON "catalog_slug_aliases" ("kind", "targetId");

-- 3) Resmi (statik) katalog düzeltmeleri: marka / model / versiyon GİZLEME (yalnız /oner form seçeneklerini etkiler)
CREATE TABLE IF NOT EXISTS "catalog_overrides" (
  "id"          SERIAL PRIMARY KEY,
  "kategori"    VARCHAR(16)  NOT NULL,
  "scope"       VARCHAR(8)   NOT NULL CHECK ("scope" IN ('BRAND', 'MODEL', 'TRIM')),
  "brandKey"    VARCHAR(100) NOT NULL,
  "modelKey"    VARCHAR(160) NOT NULL DEFAULT '',
  "versiyonKey" VARCHAR(160) NOT NULL DEFAULT '',
  "paketKey"    VARCHAR(160) NOT NULL DEFAULT '',
  "labels"      JSONB        NOT NULL DEFAULT '{}',
  "note"        VARCHAR(300),
  "isActive"    BOOLEAN      NOT NULL DEFAULT TRUE,
  "orphanedAt"  TIMESTAMP(3),
  "createdById" INTEGER,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "catalog_overrides_target_key" UNIQUE ("kategori", "scope", "brandKey", "modelKey", "versiyonKey", "paketKey")
);
CREATE INDEX IF NOT EXISTS "catalog_overrides_lookup_idx" ON "catalog_overrides" ("kategori", "brandKey") WHERE "isActive";
