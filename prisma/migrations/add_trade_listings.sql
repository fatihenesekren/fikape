-- Takasa Aç özelliği: TradeListing, MessageThread, Message, MessageReport
-- Postgres'te ALTER TYPE ... ADD VALUE kendi transaction'ında COMMIT edilmeden
-- aynı transaction içinde kullanılamıyor, bu yüzden enum ekleme ayrı ve önce çalıştırılır.

BEGIN;

ALTER TYPE "NotificationType" ADD VALUE 'TRADE_INTEREST';
ALTER TYPE "NotificationType" ADD VALUE 'NEW_TRADE_MESSAGE';

COMMIT;

-- Tablo/enum/index oluşturma tek transaction içinde (kısmi başarısızlık riskine karşı)

BEGIN;

-- CreateEnum
CREATE TYPE "TradePaymentIntent" AS ENUM ('SWAP_ONLY', 'PAYS_EXTRA', 'WANTS_EXTRA');

-- CreateEnum
CREATE TYPE "TradeCloseReason" AS ENUM ('TRADED', 'GAVE_UP', 'FOUND_ELSEWHERE');

-- CreateEnum
CREATE TYPE "MessageReportReason" AS ENUM ('SPAM', 'SCAM_ATTEMPT', 'OFFENSIVE', 'OTHER');

-- CreateEnum
CREATE TYPE "MessageReportStatus" AS ENUM ('PENDING', 'REVIEWED');

-- CreateTable
CREATE TABLE "trade_listings" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "userProductId" INTEGER NOT NULL,
    "wantCategoryId" INTEGER,
    "wantBrandId" INTEGER,
    "wantAnything" BOOLEAN NOT NULL DEFAULT false,
    "note" VARCHAR(300),
    "paymentIntent" "TradePaymentIntent" NOT NULL DEFAULT 'SWAP_ONLY',
    "city" VARCHAR(50) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "closedAt" TIMESTAMP(3),
    "closeReason" "TradeCloseReason",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trade_listings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "message_threads" (
    "id" SERIAL NOT NULL,
    "tradeListingId" INTEGER NOT NULL,
    "initiatorId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastMessageAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "hasReciprocalReply" BOOLEAN NOT NULL DEFAULT false,
    "blockedByUserId" INTEGER,
    "blockedAt" TIMESTAMP(3),

    CONSTRAINT "message_threads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" SERIAL NOT NULL,
    "threadId" INTEGER NOT NULL,
    "senderId" INTEGER NOT NULL,
    "text" VARCHAR(1000) NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "message_reports" (
    "id" SERIAL NOT NULL,
    "messageId" INTEGER NOT NULL,
    "reporterId" INTEGER NOT NULL,
    "reason" "MessageReportReason" NOT NULL,
    "note" VARCHAR(300),
    "status" "MessageReportStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "message_reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "trade_listings_userProductId_isActive_idx" ON "trade_listings"("userProductId", "isActive");

-- CreateIndex
CREATE INDEX "trade_listings_city_isActive_idx" ON "trade_listings"("city", "isActive");

-- CreateIndex
CREATE INDEX "trade_listings_userId_idx" ON "trade_listings"("userId");

-- CreateIndex — partial unique: bir üründe aynı anda tek aktif ilan (Prisma şemasında ifade edilemez, elle eklendi)
CREATE UNIQUE INDEX "trade_listings_active_user_product_key" ON "trade_listings"("userProductId") WHERE "isActive" = true;

-- CreateIndex
CREATE INDEX "message_threads_initiatorId_idx" ON "message_threads"("initiatorId");

-- CreateIndex
CREATE UNIQUE INDEX "message_threads_tradeListingId_initiatorId_key" ON "message_threads"("tradeListingId", "initiatorId");

-- CreateIndex
CREATE INDEX "messages_threadId_createdAt_idx" ON "messages"("threadId", "createdAt");

-- AddForeignKey
ALTER TABLE "trade_listings" ADD CONSTRAINT "trade_listings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trade_listings" ADD CONSTRAINT "trade_listings_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trade_listings" ADD CONSTRAINT "trade_listings_userProductId_fkey" FOREIGN KEY ("userProductId") REFERENCES "user_products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trade_listings" ADD CONSTRAINT "trade_listings_wantCategoryId_fkey" FOREIGN KEY ("wantCategoryId") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trade_listings" ADD CONSTRAINT "trade_listings_wantBrandId_fkey" FOREIGN KEY ("wantBrandId") REFERENCES "brands"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_threads" ADD CONSTRAINT "message_threads_tradeListingId_fkey" FOREIGN KEY ("tradeListingId") REFERENCES "trade_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_threads" ADD CONSTRAINT "message_threads_initiatorId_fkey" FOREIGN KEY ("initiatorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_threads" ADD CONSTRAINT "message_threads_blockedByUserId_fkey" FOREIGN KEY ("blockedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "message_threads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_reports" ADD CONSTRAINT "message_reports_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "messages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_reports" ADD CONSTRAINT "message_reports_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

COMMIT;
