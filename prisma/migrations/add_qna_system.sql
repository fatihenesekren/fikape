-- Manuel migration — Supabase SQL Editor'de çalıştırılacak
-- Kapsam: Soru-Cevap modülü (Question/Answer tabloları). Büyüme track'i
-- madde 3 — model sayfasında sahiplik yorumcularına bildirim giden
-- Soru-Cevap modülü için.

-- CreateTable
CREATE TABLE "questions" (
    "id" SERIAL NOT NULL,
    "productId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "text" VARCHAR(300) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "answers" (
    "id" SERIAL NOT NULL,
    "questionId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "text" VARCHAR(500) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "answers_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "questions"
  ADD CONSTRAINT "questions_productId_fkey"
  FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questions"
  ADD CONSTRAINT "questions_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "answers"
  ADD CONSTRAINT "answers_questionId_fkey"
  FOREIGN KEY ("questionId") REFERENCES "questions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "answers"
  ADD CONSTRAINT "answers_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Index: ürün sayfasında soruları hızlı listelemek için
CREATE INDEX "questions_productId_idx" ON "questions"("productId");
CREATE INDEX "answers_questionId_idx" ON "answers"("questionId");
