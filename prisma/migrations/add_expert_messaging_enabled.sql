-- Usta Görüşleri — bağımsız mesaj alma tercihi. İletişim bilgisi paylaşımından
-- (contactVisible) ayrı: usta istediği zaman kapatıp açabilir. Varsayılan true
-- (mevcut davranış korunur — mesajlaşma zaten her zaman açıktı).
-- Enum yok, tek ALTER — Bölüm A/B ayrımı gerekmiyor.

ALTER TABLE "expert_profiles" ADD COLUMN "messagingEnabled" BOOLEAN NOT NULL DEFAULT true;
