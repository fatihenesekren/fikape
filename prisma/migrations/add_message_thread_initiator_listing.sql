-- Mesajı atanın "ben bu aracımla teklif ediyorum" dediği kendi ilanı —
-- önceden alıcı, karşı tarafın hangi araçla teklif ettiğini hiçbir
-- şekilde göremiyordu (bkz. kullanıcı geri bildirimi).

-- AlterTable
ALTER TABLE "message_threads" ADD COLUMN     "initiatorListingId" INTEGER;

-- AddForeignKey
ALTER TABLE "message_threads" ADD CONSTRAINT "message_threads_initiatorListingId_fkey" FOREIGN KEY ("initiatorListingId") REFERENCES "trade_listings"("id") ON DELETE SET NULL ON UPDATE CASCADE;
