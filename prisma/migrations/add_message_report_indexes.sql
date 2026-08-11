-- MessageReport için eksik index'ler (Postgres FK'leri otomatik index'lemiyor).
-- Elle uygulanıyor çünkü bu projede `prisma migrate dev` çalışmıyor — bkz.
-- prisma/migrations/add_trade_listings.sql'deki aynı konvansiyon.

CREATE INDEX IF NOT EXISTS "message_reports_messageId_idx" ON "message_reports" ("messageId");
CREATE INDEX IF NOT EXISTS "message_reports_reporterId_idx" ON "message_reports" ("reporterId");
CREATE INDEX IF NOT EXISTS "message_reports_status_idx" ON "message_reports" ("status");
