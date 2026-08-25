// Takas ilanı "Hasar Durumu" sekmesi — genel hasar durumu, tramer kayıtları
// ve motor/şanzıman/yürüyen aksam durumu. Boyalı/Değişen Parça ile aynı
// prensip: kullanıcı beyanı, fikape tarafından doğrulanmamış (bkz. ilgili
// tab'daki uyarı metni).

export type DamageStatus = "NONE" | "DAMAGED" | "HEAVY";

export const DAMAGE_STATUS_LABEL: Record<DamageStatus, string> = {
  NONE: "Hasarsız",
  DAMAGED: "Hasarlı",
  HEAVY: "Ağır Hasarlı",
};

export const DAMAGE_STATUS_COLOR: Record<DamageStatus, string> = {
  NONE: "#16A34A",
  DAMAGED: "#F97316",
  HEAVY: "#EF4444",
};

export type MechanicalCondition =
  | "ORIGINAL"
  | "MINOR_FIXED"
  | "REPLACED_OEM"
  | "REPLACED_AFTERMARKET"
  | "ONGOING_ISSUE";

export const MECHANICAL_CONDITIONS: MechanicalCondition[] = [
  "ORIGINAL", "MINOR_FIXED", "REPLACED_OEM", "REPLACED_AFTERMARKET", "ONGOING_ISSUE",
];

export const MECHANICAL_CONDITION_LABEL: Record<MechanicalCondition, string> = {
  ORIGINAL: "Orijinal / Sorunsuz",
  MINOR_FIXED: "Küçük Sorun — Giderildi",
  REPLACED_OEM: "Orijinal Parça ile Değişti",
  REPLACED_AFTERMARKET: "Yan Sanayi Parça ile Değişti",
  ONGOING_ISSUE: "Devam Eden Sorun Var",
};

// PART_CONDITION_COLOR ile aynı 4 renk (gri/mavi/turuncu/kırmızı) + Küçük
// Sorun-Giderildi için yeşilimsi bir teal — görsel dil sitede tutarlı kalsın.
export const MECHANICAL_CONDITION_COLOR: Record<MechanicalCondition, string> = {
  ORIGINAL: "#9CA3AF",
  MINOR_FIXED: "#10B981",
  REPLACED_OEM: "#3B82F6",
  REPLACED_AFTERMARKET: "#F97316",
  ONGOING_ISSUE: "#EF4444",
};

export interface MechanicalComponent {
  key: "engine" | "transmission" | "runningGear";
  label: string;
  // Not alanı placeholder'ı — üçü de aynı örneği ("turbo değişti") paylaşıyordu,
  // ama turbo sadece motora ait; her bileşene kendi gerçekçi örneği verildi
  // (bkz. kullanıcı geri bildirimi).
  notePlaceholder: string;
}

export const MECHANICAL_COMPONENTS: MechanicalComponent[] = [
  { key: "engine", label: "Motor", notePlaceholder: "Opsiyonel not (örn. turbo değişti, 15.000 km'de)" },
  { key: "transmission", label: "Şanzıman", notePlaceholder: "Opsiyonel not (örn. debriyaj seti değişti, 40.000 km'de)" },
  { key: "runningGear", label: "Yürüyen Aksam", notePlaceholder: "Opsiyonel not (örn. amortisörler değişti, rot-balans yaptırıldı)" },
];

export interface TramerRecordInput {
  month: number;
  year: number;
  amount: number;
}

export function formatTl(amount: number): string {
  return `${amount.toLocaleString("tr-TR")} TL`;
}

const MONTH_LABELS = [
  "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık",
];

export function formatMonthYear(month: number, year: number): string {
  return `${MONTH_LABELS[month - 1] ?? month} ${year}`;
}
