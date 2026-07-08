-- Aksan-duyarsız arama için (örn. "citroen" araması "Citroën"i bulsun,
-- "skoda" → "Škoda"). pg_trgm ile aynı şekilde elle uygulanıyor
-- (bkz. add_pg_trgm_search.sql) — Supabase Dashboard → Database → Extensions'tan
-- "unaccent" açılabiliyorsa CREATE EXTENSION izni sorun olmaz.
CREATE EXTENSION IF NOT EXISTS unaccent;
