-- Usta Görüşleri — oy sahteciliği gecelik işi için IP/UA hash alanları.
-- KVKK: ham IP/UA tutulmaz, yalnız HMAC hash'i (Review.ipHash ile aynı desen).
-- Enum yok, tek ALTER — Bölüm A/B ayrımı gerekmiyor.

ALTER TABLE "expert_note_votes" ADD COLUMN "ipHash" TEXT;
ALTER TABLE "expert_note_votes" ADD COLUMN "userAgentHash" TEXT;
