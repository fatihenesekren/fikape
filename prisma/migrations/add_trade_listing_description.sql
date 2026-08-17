-- Takas ilanına "Açıklama" sekmesi — aracın kendisi hakkında serbest, uzun
-- metin. note (kısa takas beklentisi notu) ile karıştırılmasın diye ayrı alan.

ALTER TABLE "trade_listings" ADD COLUMN "description" VARCHAR(2000);
