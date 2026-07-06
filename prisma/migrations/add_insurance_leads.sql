-- Manuel migration — Supabase SQL Editor'de çalıştırılacak
-- Kapsam: InsuranceLead tablosu (Garaj'daki araç için opt-in sigorta teklifi
-- talebi). Gerçek partner/API entegrasyonu YOK — sadece pasif lead kaydı,
-- admin panelden görüntülenip ileride partnerlere manuel aktarılacak.

-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('NEW', 'CONTACTED', 'CONVERTED');

-- CreateTable
CREATE TABLE "insurance_leads" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "fullName" VARCHAR(100) NOT NULL,
    "phone" VARCHAR(20) NOT NULL,
    "status" "LeadStatus" NOT NULL DEFAULT 'NEW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "insurance_leads_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "insurance_leads_userId_productId_key" ON "insurance_leads"("userId", "productId");

-- AddForeignKey
ALTER TABLE "insurance_leads"
  ADD CONSTRAINT "insurance_leads_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "insurance_leads"
  ADD CONSTRAINT "insurance_leads_productId_fkey"
  FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
