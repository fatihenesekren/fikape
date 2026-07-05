-- Manuel migration — Supabase SQL Editor'de çalıştırılacak
-- Kapsam: ModerationLog audit tablosu (hangi admin, hangi review'u, ne zaman,
-- hangi sebeple onayladı/reddetti)
-- Not: `prisma migrate diff` çıktısında bununla alakasız bilinen bir drift
-- (vehicle_suggestions enum/FK yeniden oluşturma, birkaç DateTime tip
-- değişikliği) de geldi — bilinçli olarak bu dosyaya dahil edilmedi.

-- CreateEnum
CREATE TYPE "ModerationAction" AS ENUM ('APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "moderation_logs" (
    "id" SERIAL NOT NULL,
    "reviewId" INTEGER NOT NULL,
    "moderatorId" INTEGER NOT NULL,
    "action" "ModerationAction" NOT NULL,
    "reason" VARCHAR(300),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "moderation_logs_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "moderation_logs"
  ADD CONSTRAINT "moderation_logs_reviewId_fkey"
  FOREIGN KEY ("reviewId") REFERENCES "reviews"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "moderation_logs"
  ADD CONSTRAINT "moderation_logs_moderatorId_fkey"
  FOREIGN KEY ("moderatorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
