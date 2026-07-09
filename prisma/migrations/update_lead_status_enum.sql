-- Manuel migration — Supabase SQL Editor'de çalıştırılacak
-- Kapsam: LeadStatus enum'ını genişletiyor. "Dönüştü" (CONVERTED) tek terminal
-- durum yerine, iletişime geçildikten sonraki sürecin daha ayrıntılı takibi:
-- Beklemede (PENDING) / Tamamlandı (COMPLETED) / Yapılmadı (NOT_DONE).
-- Postgres enum'dan değer silinemediği için tip yeniden oluşturuluyor.
-- Var olan CONVERTED kayıtları (varsa) COMPLETED'e taşınır.

ALTER TYPE "LeadStatus" RENAME TO "LeadStatus_old";

CREATE TYPE "LeadStatus" AS ENUM ('NEW', 'CONTACTED', 'PENDING', 'COMPLETED', 'NOT_DONE');

ALTER TABLE "insurance_leads"
  ALTER COLUMN "status" DROP DEFAULT,
  ALTER COLUMN "status" TYPE "LeadStatus" USING (
    CASE "status"::text
      WHEN 'CONVERTED' THEN 'COMPLETED'
      ELSE "status"::text
    END
  )::"LeadStatus",
  ALTER COLUMN "status" SET DEFAULT 'NEW';

ALTER TABLE "sale_leads"
  ALTER COLUMN "status" DROP DEFAULT,
  ALTER COLUMN "status" TYPE "LeadStatus" USING (
    CASE "status"::text
      WHEN 'CONVERTED' THEN 'COMPLETED'
      ELSE "status"::text
    END
  )::"LeadStatus",
  ALTER COLUMN "status" SET DEFAULT 'NEW';

DROP TYPE "LeadStatus_old";
