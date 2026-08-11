-- Faz 3: takas sonrası karşılıklı değerlendirme (rating) sistemi.

CREATE TABLE "trade_ratings" (
    "id" SERIAL NOT NULL,
    "threadId" INTEGER NOT NULL,
    "raterId" INTEGER NOT NULL,
    "ratedUserId" INTEGER NOT NULL,
    "score" INTEGER NOT NULL,
    "comment" VARCHAR(300),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trade_ratings_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "trade_ratings_threadId_raterId_key" ON "trade_ratings" ("threadId", "raterId");
CREATE INDEX "trade_ratings_ratedUserId_idx" ON "trade_ratings" ("ratedUserId");

ALTER TABLE "trade_ratings" ADD CONSTRAINT "trade_ratings_threadId_fkey"
    FOREIGN KEY ("threadId") REFERENCES "message_threads"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "trade_ratings" ADD CONSTRAINT "trade_ratings_raterId_fkey"
    FOREIGN KEY ("raterId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "trade_ratings" ADD CONSTRAINT "trade_ratings_ratedUserId_fkey"
    FOREIGN KEY ("ratedUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
