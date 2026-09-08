-- Genel Hasar Durumu için opsiyonel serbest metin notu — motor/şanzıman/
-- yürüyen aksam notlarıyla aynı desen (VARCHAR(300), kullanıcı beyanı).

-- AlterTable
ALTER TABLE "trade_listings" ADD COLUMN "damageStatusNote" VARCHAR(300);
