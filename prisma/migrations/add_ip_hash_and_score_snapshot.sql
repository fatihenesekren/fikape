-- Manuel migration — Supabase SQL Editor'de çalıştırılacak
-- Kapsam: Review.ipHash / Review.userAgentHash + ScoreSnapshot audit tablosu
-- Not: `prisma migrate diff` çıktısında bununla alakasız bir drift (vehicle_suggestions
-- enum/FK yeniden oluşturma, birkaç DateTime tip değişikliği) da geldi — o kısım
-- bilinçli olarak bu dosyaya dahil edilmedi, ayrıca değerlendirilmeli.

-- CreateEnum
CREATE TYPE "SnapshotReason" AS ENUM ('CREATED', 'PUBLISHED', 'REJECTED', 'EDITED');

-- AlterTable
ALTER TABLE "reviews"
  ADD COLUMN "ipHash" TEXT,
  ADD COLUMN "userAgentHash" TEXT;

-- CreateTable
CREATE TABLE "score_snapshots" (
    "id" SERIAL NOT NULL,
    "reviewId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "trustScore" INTEGER NOT NULL,
    "scoreOverall" DOUBLE PRECISION NOT NULL,
    "status" "ReviewStatus" NOT NULL,
    "reason" "SnapshotReason" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "score_snapshots_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "score_snapshots"
  ADD CONSTRAINT "score_snapshots_reviewId_fkey"
  FOREIGN KEY ("reviewId") REFERENCES "reviews"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
