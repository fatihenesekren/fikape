-- Usta Görüşleri — Aşama 9 (bölgesel görünürlük). Kullanıcının opsiyonel
-- beyan ettiği il — eşleşme yoksa "Türkiye geneli" fallback'i devreye girer.
-- Enum değişikliği yok, tek kolon — Bölüm A/B ayrımı gerekmiyor.

ALTER TABLE "users" ADD COLUMN "city" VARCHAR(50);
