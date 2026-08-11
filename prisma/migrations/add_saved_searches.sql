-- Faz 3: kayıtlı arama / eşleşme bildirimi.

BEGIN;

ALTER TYPE "NotificationType" ADD VALUE 'SAVED_SEARCH_MATCH';

COMMIT;

BEGIN;

CREATE TABLE "saved_searches" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "city" VARCHAR(50) NOT NULL,
    "categoryId" INTEGER,
    "brandId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "saved_searches_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "saved_searches_userId_city_categoryId_brandId_key"
    ON "saved_searches" ("userId", "city", "categoryId", "brandId");
CREATE INDEX "saved_searches_city_idx" ON "saved_searches" ("city");

ALTER TABLE "saved_searches" ADD CONSTRAINT "saved_searches_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "saved_searches" ADD CONSTRAINT "saved_searches_categoryId_fkey"
    FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "saved_searches" ADD CONSTRAINT "saved_searches_brandId_fkey"
    FOREIGN KEY ("brandId") REFERENCES "brands"("id") ON DELETE SET NULL ON UPDATE CASCADE;

COMMIT;
