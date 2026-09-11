-- Usta Görüşleri — işyeri/dükkan adı alanı (örn. "ABC Rot-Balans").
-- Telefon/adresle aynı rıza (EXPERT_CONTACT_PUBLIC) ve aynı görünürlük
-- eşiğine (CONTACT_VISIBILITY_MIN_PUBLISHED_NOTES) tabidir.
-- Enum yok, tek ALTER — Bölüm A/B ayrımı gerekmiyor.

ALTER TABLE "expert_profiles" ADD COLUMN "businessName" VARCHAR(120);
