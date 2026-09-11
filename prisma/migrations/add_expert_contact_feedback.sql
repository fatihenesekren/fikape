-- Usta Görüşleri — topluluk iletişim teyidi (ExpertContactFeedback).
-- Kimlik/belge doğrulaması kaldırıldığı için telefon/adresin gerçekliği
-- hakkında platform beyanda bulunmaz; bunun yerine gerçekten iletişime geçmiş
-- kullanıcıların "doğru muydu?" oyları bir eşiği geçince gösterilir.
-- Enum yok, tek Bölüm — Bölüm A/B ayrımı gerekmiyor.

BEGIN;

CREATE TABLE "expert_contact_feedback" (
    "id" SERIAL NOT NULL,
    "profileId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "isAccurate" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "expert_contact_feedback_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "expert_contact_feedback_profileId_userId_key" ON "expert_contact_feedback"("profileId", "userId");
CREATE INDEX "expert_contact_feedback_profileId_isAccurate_idx" ON "expert_contact_feedback"("profileId", "isAccurate");

ALTER TABLE "expert_contact_feedback" ADD CONSTRAINT "expert_contact_feedback_profileId_fkey"
    FOREIGN KEY ("profileId") REFERENCES "expert_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "expert_contact_feedback" ADD CONSTRAINT "expert_contact_feedback_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

COMMIT;
