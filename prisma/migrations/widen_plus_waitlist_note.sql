-- Manuel migration — Supabase SQL Editor'de çalıştırılacak
-- Kapsam: plus_waitlist_entries.note kolonunu 280 -> 500 karaktere genişletir
-- (Plus sayfasındaki fikir kutusu artık yorum formlarıyla aynı 500 karakter
-- sınırını kullanıyor).

ALTER TABLE "plus_waitlist_entries"
  ALTER COLUMN "note" TYPE VARCHAR(500);
