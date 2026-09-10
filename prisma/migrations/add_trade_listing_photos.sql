-- Takas ilanına özel, moderasyonlu fotoğraflar (yorumdaki product_photos'tan ayrı).
-- Auto-APPROVE yok: PENDING başlar, admin /admin/takas-fotograflari'ndan onaylar.
-- İlan kapanınca anonimleştirme cron'u + hesap silme akışı blob'u ve satırı siler.

-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'ADMIN_NEW_TRADE_PHOTO';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'TRADE_PHOTO_MODERATED';

-- CreateTable
CREATE TABLE "trade_listing_photos" (
    "id" SERIAL NOT NULL,
    "tradeListingId" INTEGER NOT NULL,
    "uploadedByUserId" INTEGER,
    "url" TEXT NOT NULL,
    "status" "PhotoStatus" NOT NULL DEFAULT 'PENDING',
    "order" INTEGER NOT NULL DEFAULT 0,
    "phash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trade_listing_photos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "trade_listing_photos_tradeListingId_status_idx" ON "trade_listing_photos"("tradeListingId", "status");

-- AddForeignKey
ALTER TABLE "trade_listing_photos" ADD CONSTRAINT "trade_listing_photos_tradeListingId_fkey" FOREIGN KEY ("tradeListingId") REFERENCES "trade_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trade_listing_photos" ADD CONSTRAINT "trade_listing_photos_uploadedByUserId_fkey" FOREIGN KEY ("uploadedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
