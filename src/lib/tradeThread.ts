// Takas görüşmesi durum kuralları — tek kaynak.

// "Görüşmeyi kapat" sonrası, KAPATAN kişiye karşı, karşı taraf bu kadar gün
// yeni bir görüşme başlatamaz (kullanıcı-çifti bazlı, ilandan bağımsız —
// çok-ilan üzerinden sık boğaz etmeyi otomatik friction'la keser). Kalıcı
// çözüm "Kişiyi engelle".
export const CLOSE_COOLDOWN_DAYS = 7;
export const CLOSE_COOLDOWN_MS = CLOSE_COOLDOWN_DAYS * 24 * 60 * 60 * 1000;

// Bir kişiyle bu kadar görüşme kapattıysan arayüz "Kişiyi engelle" önerisini
// öne çıkarır (eskalasyon uyarısı).
export const ESCALATION_CLOSE_COUNT = 2;
