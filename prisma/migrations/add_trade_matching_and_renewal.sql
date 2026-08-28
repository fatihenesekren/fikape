-- Eşleştirme motoru (karşılıklı eşleşme bildirimi) ve "İlan Yenile" özelliği
-- için gereken alanlar.

-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'TRADE_MUTUAL_MATCH';

-- AlterTable
ALTER TABLE "trade_listings" ADD COLUMN     "effectiveDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Mevcut ilanlar için effectiveDate'i migration anının "now()"ı yerine
-- gerçek açılış tarihine (createdAt) eşitle — aksi halde tüm eski ilanlar
-- sıralamada aynı anda açılmış gibi görünür, gerçek kronolojik sırası kaybolur.
UPDATE "trade_listings" SET "effectiveDate" = "createdAt";
