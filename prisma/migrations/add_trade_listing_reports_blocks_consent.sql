-- Faz 2: ilan bazlı rapor mekanizması (TradeListingReport), kullanıcı-bazlı kalıcı
-- blok (BlockedUser), takas KVKK rızası (ConsentType.TRADE_LISTING).
-- Postgres'te ALTER TYPE ... ADD VALUE kendi transaction'ında COMMIT edilmeden aynı
-- transaction içinde kullanılamıyor, bu yüzden enum ekleme ayrı ve önce çalıştırılır
-- (bkz. add_trade_listings.sql'deki aynı konvansiyon).

BEGIN;

ALTER TYPE "ConsentType" ADD VALUE 'TRADE_LISTING';

COMMIT;

BEGIN;

-- CreateTable
CREATE TABLE "trade_listing_reports" (
    "id" SERIAL NOT NULL,
    "tradeListingId" INTEGER NOT NULL,
    "reporterId" INTEGER NOT NULL,
    "reason" "MessageReportReason" NOT NULL,
    "note" VARCHAR(300),
    "status" "MessageReportStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trade_listing_reports_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "trade_listing_reports_tradeListingId_idx" ON "trade_listing_reports" ("tradeListingId");
CREATE INDEX "trade_listing_reports_reporterId_idx" ON "trade_listing_reports" ("reporterId");
CREATE INDEX "trade_listing_reports_status_idx" ON "trade_listing_reports" ("status");

ALTER TABLE "trade_listing_reports" ADD CONSTRAINT "trade_listing_reports_tradeListingId_fkey"
    FOREIGN KEY ("tradeListingId") REFERENCES "trade_listings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "trade_listing_reports" ADD CONSTRAINT "trade_listing_reports_reporterId_fkey"
    FOREIGN KEY ("reporterId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "blocked_users" (
    "id" SERIAL NOT NULL,
    "blockerId" INTEGER NOT NULL,
    "blockedId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "blocked_users_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "blocked_users_blockerId_blockedId_key" ON "blocked_users" ("blockerId", "blockedId");
CREATE INDEX "blocked_users_blockedId_idx" ON "blocked_users" ("blockedId");

ALTER TABLE "blocked_users" ADD CONSTRAINT "blocked_users_blockerId_fkey"
    FOREIGN KEY ("blockerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "blocked_users" ADD CONSTRAINT "blocked_users_blockedId_fkey"
    FOREIGN KEY ("blockedId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

COMMIT;
