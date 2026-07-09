-- Manuel migration — Supabase SQL Editor'de çalıştırılacak
-- Kapsam: Araç Öner formuna "Vites Tipi" alanı eklendi. Kullanıcı kendi
-- aracının vites tipini (Manuel/Otomatik/CVT/Yarı Otomatik) doğrudan
-- belirtiyor — dış kaynaktan tahmin etmeye gerek kalmıyor.

ALTER TABLE "vehicle_suggestions" ADD COLUMN "transmission" TEXT;
