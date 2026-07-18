-- Migration: ContentReport (araç sayfasında teknik özellik/fotoğraf/yorum/soru-cevap hata bildirimi)
-- Run this in Supabase SQL Editor

-- CreateEnum
CREATE TYPE "ContentReportTargetType" AS ENUM ('SPEC', 'PHOTO', 'REVIEW', 'QNA');

-- CreateEnum
CREATE TYPE "ContentReportStatus" AS ENUM ('PENDING', 'RESOLVED', 'REJECTED');

-- CreateTable
CREATE TABLE "content_reports" (
    "id" SERIAL NOT NULL,
    "productId" INTEGER NOT NULL,
    "reporterId" INTEGER NOT NULL,
    "targetType" "ContentReportTargetType" NOT NULL,
    "field" VARCHAR(100),
    "photoId" INTEGER,
    "reviewId" INTEGER,
    "questionId" INTEGER,
    "note" VARCHAR(500) NOT NULL,
    "status" "ContentReportStatus" NOT NULL DEFAULT 'PENDING',
    "resolvedAt" TIMESTAMP(3),
    "resolvedBy" INTEGER,
    "adminNote" VARCHAR(300),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "content_reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "content_reports_productId_idx" ON "content_reports"("productId");

-- CreateIndex
CREATE INDEX "content_reports_status_idx" ON "content_reports"("status");

-- AddForeignKey
ALTER TABLE "content_reports" ADD CONSTRAINT "content_reports_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_reports" ADD CONSTRAINT "content_reports_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_reports" ADD CONSTRAINT "content_reports_photoId_fkey" FOREIGN KEY ("photoId") REFERENCES "product_photos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_reports" ADD CONSTRAINT "content_reports_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "reviews"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_reports" ADD CONSTRAINT "content_reports_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "questions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
