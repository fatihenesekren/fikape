// ─────────────────────────────────────────────
// USTA GÖRÜŞLERI — yapılandırılmış alan tanımları + rozet
// Tam tasarım: docs/usta-gorusleri-plan.md
// ─────────────────────────────────────────────

// "Usta" rozeti — TrustLevel rozetlerinden AYRI eksen (yetkinlik ≠ kimlik
// güveni). Bir usta TrustLevel 1 de olabilir. Not kartında ve (çift şapka)
// ustanın kendi sahiplik yorumunda gösterilir; ustanın sahiplik yorumundaki
// rozet profile DERİN LİNK VERMEZ (yalnız "Usta Görüşleri Nedir?" sayfasına).
//
// ⚠️ BİLİNÇLİ TASARIM KARARI (11 Eylül 2026): Kimlik/meslek belgesi doğrulaması
// KALDIRILDI — kurucu kararı. Gerekçe: (a) bu bir reklam/CV yüzeyi, ücretli iş
// değil — sahte biri risk alıp emek harcayarak burada "usta" görünmeye
// çalışmaz; (b) her not zaten admin moderasyonundan geçiyor; (c) barem +
// oy-sahteciliği tespiti kötü/sahte katkıyı otomatik söndürüyor. Bu yüzden
// rozet ve metinler ASLA "doğrulanmış/doğrulandı" ifadesi kullanmaz — bu,
// platformun kimlik/belge kontrolü yaptığı izlenimini verir ve gereksiz hukuki
// yükümlülük doğurabilir. Beyan temelli olduğu her yerde açıkça belirtilir.
export const EXPERT_BADGE = {
  icon: "🔧",
  label: "Usta",
  tooltip: "Bu kişi kendini usta/teknik uzman olarak tanımlamıştır. fikape kimlik veya meslek belgesi doğrulaması yapmaz; içerikleri yayından önce incelenir.",
  color: "#7A3E00",
  bg: "#FBEEDF",
} as const;

// Not kartı ve tab başında görünen sabit feragat (KİLİTLENDİ — kurucu kararı).
// "reklam / ödeme karşılığı" ifadeleri BİLİNÇLİ olarak yok (§14.8).
export const EXPERT_NOTE_DISCLAIMER =
  "Usta görüşleri, ustaların gönüllü teknik katkısıdır. fikape puanını etkilemez, sıralamada yer değiştirmez.";

// Not gövdesi
export const EXPERT_NOTE_TITLE_MAX = 140;
export const EXPERT_NOTE_BODY_MIN = 120;
export const EXPERT_NOTE_BODY_MAX = 4000;

// Yapılandırılmış alanlar — hepsi opsiyonel, serbest metin. Not gövdesini
// tamamlayan, kıyaslanabilir teknik başlıklar.
export interface ExpertNoteField {
  key: string;
  label: string;
  placeholder: string;
  maxLength: number;
  multiline?: boolean;
}

export const EXPERT_NOTE_FIELDS: ExpertNoteField[] = [
  {
    key: "kronik_arizalar",
    label: "Kronik arızalar / zayıf noktalar",
    placeholder: "Bu modelde sık gördüğünüz arızalar, hangi km civarında ortaya çıkar...",
    maxLength: 800,
    multiline: true,
  },
  {
    key: "bakim_maliyeti",
    label: "Bakım maliyeti",
    placeholder: "Periyodik bakım, sarf malzeme, işçilik — segmentine göre nasıl?",
    maxLength: 400,
    multiline: true,
  },
  {
    key: "parca_bulunurlugu",
    label: "Yedek parça bulunurluğu",
    placeholder: "Orijinal/yan sanayi parça bulunur mu, fiyatı, tedarik süresi...",
    maxLength: 400,
    multiline: true,
  },
  {
    key: "kacinilacak_yil_motor",
    label: "Kaçınılacak yıl / motor kombinasyonu",
    placeholder: "Hangi model yılı veya motor seçeneği sorunlu, hangisi tercih edilmeli...",
    maxLength: 400,
    multiline: true,
  },
  {
    key: "alinirken_bak",
    label: "İkinci elde alırken nelere bakılmalı",
    placeholder: "Ekspertizde özellikle kontrol edilmesi gereken noktalar...",
    maxLength: 600,
    multiline: true,
  },
];

export const EXPERT_NOTE_FIELD_KEYS = EXPERT_NOTE_FIELDS.map((f) => f.key);
export const EXPERT_NOTE_FIELD_LABEL: Record<string, string> = Object.fromEntries(
  EXPERT_NOTE_FIELDS.map((f) => [f.key, f.label])
);

// Rate limit — sahiplik yorumundan (24s/5) AYRI ve daha gevşek (usta bir
// oturuşta birkaç model hakkında yazabilir), ama sınırlı: moderasyon kuyruğunu
// korur, kaliteyi değil.
export const EXPERT_NOTE_RATE_DAY = 3;
export const EXPERT_NOTE_RATE_WEEK = 10;

// `structured` JSON'ından yalnız bilinen anahtarları, kırpılmış olarak alır.
export function sanitizeStructured(input: unknown): Record<string, string> {
  const out: Record<string, string> = {};
  if (!input || typeof input !== "object") return out;
  const obj = input as Record<string, unknown>;
  for (const f of EXPERT_NOTE_FIELDS) {
    const v = obj[f.key];
    if (typeof v === "string" && v.trim()) {
      out[f.key] = v.trim().slice(0, f.maxLength);
    }
  }
  return out;
}
