-- Manuel migration — Supabase SQL Editor'de çalıştırılacak
-- Kapsam: kategori tip enum'larının kodla (src/lib/vehicleTypes.ts) senkronlanması.
-- Kök neden: seed.ts kategori upsert'leri update:{} kullandığı için prod
-- attributeSchema'ları eski kalmıştı (motosiklette alan adı bile farklıydı:
-- kod moto_type okurken şemada "type" duruyordu).

-- 1) Motosiklet: eski "type" alanını kaldır, moto_type'ı tam listeyle yaz
--    (scooter, cross, cruiser, retro eklendi; adventure/elektrikli zaten üründe kullanılıyordu)
UPDATE categories
SET "attributeSchema" = ("attributeSchema" - 'type') || jsonb_build_object(
  'moto_type', jsonb_build_object(
    'type', 'enum', 'label', 'Tip',
    'values', jsonb_build_array('naked','sport','scooter','adventure','touring','enduro','cross','cruiser','retro','elektrikli')
  )
)
WHERE slug = 'motosiklet';

-- 2) Otomobil: body_type'a station/pickup/van eklendi (admin formu zaten pickup/van sunuyordu)
UPDATE categories
SET "attributeSchema" = jsonb_set(
  "attributeSchema", '{body_type,values}',
  jsonb_build_array('sedan','hatchback','suv','station','mpv','coupe','cabrio','pickup','van')
)
WHERE slug = 'otomobil';

-- 3) Kamyonet: panelvan eklendi (admin formundaki "panel" değeri hiç kullanılmamıştı,
--    standart değer "panelvan" olarak birleştirildi)
UPDATE categories
SET "attributeSchema" = jsonb_set(
  "attributeSchema", '{body_type,values}',
  jsonb_build_array('pickup','van','panelvan','minivan')
)
WHERE slug = 'kamyonet';

-- 4) E-Scooter: legacy scooter_type alanı kaldırıldı (e-bisiklet ayrı kategori,
--    alan hiçbir yerde gösterilmiyor/sorulmıyordu)
UPDATE categories
SET "attributeSchema" = "attributeSchema" - 'scooter_type'
WHERE slug = 'e-scooter';

-- 5) Honda PCX 125: eksik tip ataması
UPDATE products
SET attributes = attributes || '{"moto_type": "scooter"}'::jsonb
WHERE slug = 'honda-pcx-125-125cc-12-5-cv-standart-2025';

-- 6) Öneri onayından gelen ürünlerde string olarak kaydedilmiş sayı/boolean
--    attribute'ları gerçek JSON tiplerine çevir ("125" → 125, "true" → true).
--    Enum/metin değerler (GASOLINE, IP54, standard-25 vb.) regex'e takılmaz, dokunulmaz.
UPDATE products p
SET attributes = (
  SELECT jsonb_object_agg(key,
    CASE
      WHEN jsonb_typeof(value) = 'string' AND value #>> '{}' IN ('true','false')
        THEN to_jsonb((value #>> '{}')::boolean)
      WHEN jsonb_typeof(value) = 'string' AND value #>> '{}' ~ '^-?[0-9]+(\.[0-9]+)?$'
        THEN to_jsonb((value #>> '{}')::numeric)
      ELSE value
    END)
  FROM jsonb_each(p.attributes)
)
WHERE p.attributes <> '{}'::jsonb
  AND EXISTS (
    SELECT 1 FROM jsonb_each(p.attributes) e
    WHERE jsonb_typeof(e.value) = 'string'
      AND (e.value #>> '{}' IN ('true','false') OR e.value #>> '{}' ~ '^-?[0-9]+(\.[0-9]+)?$')
  );
