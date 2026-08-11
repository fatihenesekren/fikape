-- Faz 3: gerçek anonimleştirme — TradeListing.note artık cron tarafından
-- temizleniyor, anonymizedAt idempotency/audit alanı olarak eklendi.

ALTER TABLE "trade_listings" ADD COLUMN "anonymizedAt" TIMESTAMP(3);
