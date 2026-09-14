-- Engellenen Kullanıcılar'da Takas/Usta ayrımı — kullanıcı isteği (14 Eylül 2026).
-- Yeni enum tipi + tek nullable kolon; mevcut kayıtlar NULL kalır (bilinmiyor).
-- Engelin ETKİSİ hâlâ birleşiktir, bu yalnız görüntüleme/bilgi amaçlıdır.

CREATE TYPE "BlockSource" AS ENUM ('TAKAS', 'USTA');

ALTER TABLE "blocked_users" ADD COLUMN "source" "BlockSource";
