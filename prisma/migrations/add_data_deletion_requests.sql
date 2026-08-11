-- Faz 3: hesap silme akışı. Model şemada zaten tanımlıydı ama tablo hiç
-- oluşturulmamıştı (hiçbir kod yazmadığı için "ölü kod" olarak tespit edilmişti
-- — bkz. denetim raporu, KRİTİK madde).
-- Idempotent yazıldı: "DeletionStatus" tipi projenin daha önceki bir
-- aşamasında (muhtemelen prisma migrate dev hâlâ çalışırken) zaten
-- oluşturulmuş çıktı, sadece tablo eksikti.

DO $$ BEGIN
  CREATE TYPE "DeletionStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'REJECTED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "data_deletion_requests" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "reason" VARCHAR(500),
    "status" "DeletionStatus" NOT NULL DEFAULT 'PENDING',
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "completedBy" INTEGER,

    CONSTRAINT "data_deletion_requests_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "data_deletion_requests_userId_idx" ON "data_deletion_requests" ("userId");
CREATE INDEX IF NOT EXISTS "data_deletion_requests_status_idx" ON "data_deletion_requests" ("status");

DO $$ BEGIN
  ALTER TABLE "data_deletion_requests" ADD CONSTRAINT "data_deletion_requests_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
