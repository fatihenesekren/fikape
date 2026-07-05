-- Fuzzy arama: pg_trgm ile typo toleranslı arama + ILIKE performansı için GIN index

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS "products_name_trgm_idx" ON "products" USING GIN ("name" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "models_name_trgm_idx" ON "models" USING GIN ("name" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "brands_name_trgm_idx" ON "brands" USING GIN ("name" gin_trgm_ops);
