-- Manuel migration — Supabase SQL Editor'de çalıştırılacak
-- Kapsam: insurance_leads.phone ve sale_leads.phone kolonlarını 20 -> 255 karaktere genişletir.
-- Neden: telefonlar artık AES-256-GCM ile şifreli saklanabilir ("l1:" önekli, ~70 karakter; bkz. src/lib/leadPhoneCrypto.ts).
-- SIRA: 1) bu SQL'i çalıştır  2) Vercel'de LEAD_PHONE_ENCRYPTION=1 tanımla ve yeniden dağıt.
-- Mevcut (düz metin) kayıtlar olduğu gibi okunmaya devam eder; yenileri şifreli yazılır.

ALTER TABLE "insurance_leads" ALTER COLUMN "phone" TYPE VARCHAR(255);
ALTER TABLE "sale_leads"      ALTER COLUMN "phone" TYPE VARCHAR(255);
