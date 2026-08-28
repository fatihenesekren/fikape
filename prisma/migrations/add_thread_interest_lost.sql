-- Görüşmeyi başlatan tarafın (ilan sahibi olmayanın) "ilgimi kaybettim"
-- diyebilmesi için — Block'tan farklı, mesajlaşmayı kapatmaz, sadece
-- karşı tarafa yumuşak bir sinyal verir.

-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'TRADE_INTEREST_LOST';

-- AlterTable
ALTER TABLE "message_threads" ADD COLUMN     "interestLostAt" TIMESTAMP(3),
ADD COLUMN     "interestLostByUserId" INTEGER;

-- AddForeignKey
ALTER TABLE "message_threads" ADD CONSTRAINT "message_threads_interestLostByUserId_fkey" FOREIGN KEY ("interestLostByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
