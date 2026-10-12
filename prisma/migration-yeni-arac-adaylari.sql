-- Aylık "kataloğa eklenecek yeni araçlar" adayları (haftalık rapor ayın ilk Pazartesi bölümü + /admin/katalog Önerilenler).
-- Yalnız CREATE TABLE / CREATE INDEX içerir (DROP yok). Supabase SQL Editor'den elle çalıştırılır (bkz. OPERATIONS.md).
-- Bilinçli olarak FOREIGN KEY yok: aday kaydı, ürün silinse de geçmiş kararı (reddedildi / eklendi) korumalı.
-- Kişisel veri YOK: yalnız araç bilgisi + kaynak bağlantısı.

CREATE TABLE IF NOT EXISTS "new_vehicle_candidates" (
  "id"             SERIAL PRIMARY KEY,
  "ay"             VARCHAR(7)   NOT NULL,                       -- üretildiği ay, 'YYYY-MM'
  "kirilim"        VARCHAR(24)  NOT NULL CHECK ("kirilim" IN (
                     'otomobil', 'motosiklet', 'elektrikli-motosiklet', 'e-scooter', 'e-bisiklet',
                     'motorlu-karavan', 'cekme-karavan', 'pickup', 'van')),
  "anahtar"        VARCHAR(200) NOT NULL,                       -- normalize marka-model (aksansız slug); tekrar/ret süzgeci
  "marka"          VARCHAR(80)  NOT NULL,
  "model"          VARCHAR(100) NOT NULL,
  "versiyon"       VARCHAR(100),
  "yil"            INTEGER,
  "tarihNotu"      VARCHAR(60),                                 -- "Kasım 2026", "satışta" vb. (serbest, kaynağa göre)
  "kaynakUrl"      VARCHAR(500) NOT NULL,
  "kaynakAdi"      VARCHAR(120),
  "kaynakKademe"   CHAR(1)      NOT NULL CHECK ("kaynakKademe" IN ('A', 'B')),  -- C kademesi aday olmaz
  "kanit"          VARCHAR(300),                                -- Türkiye satışına işaret eden kısa alıntı/özet
  "skor"           INTEGER      NOT NULL DEFAULT 0,
  "katalogdaVar"   BOOLEAN      NOT NULL DEFAULT FALSE,
  "mevcutUrunId"   INTEGER,                                     -- katalogdaVar ise eşleşen ürün (bilgi amaçlı)
  "durum"          VARCHAR(12)  NOT NULL DEFAULT 'ONERILDI' CHECK ("durum" IN ('ONERILDI', 'TASLAK', 'EKLENDI', 'REDDEDILDI')),
  "urunId"         INTEGER,                                     -- TASLAK / EKLENDI ise oluşan ürün
  "kararTarihi"    TIMESTAMP(3),
  "kararVerenId"   INTEGER,
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "new_vehicle_candidates_kirilim_anahtar_key" UNIQUE ("kirilim", "anahtar")
);
CREATE INDEX IF NOT EXISTS "new_vehicle_candidates_ay_idx"    ON "new_vehicle_candidates" ("ay", "kirilim");
CREATE INDEX IF NOT EXISTS "new_vehicle_candidates_durum_idx" ON "new_vehicle_candidates" ("durum");
