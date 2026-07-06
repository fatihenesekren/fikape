-- Manuel migration — Supabase SQL Editor'de çalıştırılacak
-- Kapsam: SaleLead tablosu ("Sattım" formunu AÇTIĞI an — satış niyeti anı,
-- henüz kaydetmeden — gösterilen opt-in ekspertiz/hızlı teklif talebi).
-- Gerçek partner/API entegrasyonu YOK — sadece pasif lead kaydı.
-- LeadStatus enum'u insurance_leads ile paylaşılıyor (add_insurance_leads.sql'de oluşturuldu).

-- CreateEnum
CREATE TYPE "SaleLeadType" AS ENUM ('EXPERTISE', 'QUICK_OFFER');

-- CreateTable
CREATE TABLE "sale_leads" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "type" "SaleLeadType" NOT NULL,
    "fullName" VARCHAR(100) NOT NULL,
    "phone" VARCHAR(20) NOT NULL,
    "status" "LeadStatus" NOT NULL DEFAULT 'NEW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sale_leads_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "sale_leads_userId_productId_type_key" ON "sale_leads"("userId", "productId", "type");

-- AddForeignKey
ALTER TABLE "sale_leads"
  ADD CONSTRAINT "sale_leads_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_leads"
  ADD CONSTRAINT "sale_leads_productId_fkey"
  FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
