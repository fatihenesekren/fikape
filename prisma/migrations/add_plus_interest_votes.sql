-- Manuel migration — Supabase SQL Editor'de çalıştırılacak
-- Kapsam: PlusInterestVote tablosu — Plus sayfasındaki fikir kartlarına
-- verilen "İlgileniyorum" oyları. Sadece giriş yapmış kullanıcı oy verebilir,
-- kart başına en fazla 1 oy (unique userId+interestKey).

-- CreateTable
CREATE TABLE "plus_interest_votes" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "interestKey" VARCHAR(64) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "plus_interest_votes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "plus_interest_votes_userId_interestKey_key" ON "plus_interest_votes"("userId", "interestKey");

-- CreateIndex
CREATE INDEX "plus_interest_votes_interestKey_idx" ON "plus_interest_votes"("interestKey");

-- AddForeignKey
ALTER TABLE "plus_interest_votes"
  ADD CONSTRAINT "plus_interest_votes_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
