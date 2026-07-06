-- Manuel migration — Supabase SQL Editor'de çalıştırılacak
-- Kapsam: PlusWaitlistEntry tablosu — Fikape Plus (gelişmiş filtre/kayıtlı arama)
-- için gerçek ödeme YOK, sadece talep sinyali toplayan bekleme listesi (fake door test).
-- userId opsiyonel: giriş yapmamış ziyaretçi de sadece e-posta ile katılabilir.

-- CreateTable
CREATE TABLE "plus_waitlist_entries" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER,
    "email" VARCHAR(255) NOT NULL,
    "note" VARCHAR(280),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "plus_waitlist_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "plus_waitlist_entries_email_key" ON "plus_waitlist_entries"("email");

-- AddForeignKey
ALTER TABLE "plus_waitlist_entries"
  ADD CONSTRAINT "plus_waitlist_entries_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
