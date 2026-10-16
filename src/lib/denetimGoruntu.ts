// Denetim kaydı sayfası için görünüm yardımcıları (saf fonksiyonlar, testli).

export type RozetRengi = "yesil" | "mavi" | "kirmizi" | "sari" | "mor" | "gri";

/** İşlem anahtarına göre rozet rengi: ekleme/onay yeşil, değişiklik mavi, silme/ban/ret kırmızı, gizleme sarı, hassas veri erişimi mor. */
export function eylemRengi(action: string): RozetRengi {
  if (action === "LEAD_PHONE_REVEAL") return "mor";
  if (action === "CACHE_TEMIZLE") return "gri";
  if (/UNBAN|CREATE|APPROVE|REACTIVATE|RESTORE/.test(action)) return "yesil";
  if (/DELETE|DEACTIVATE|BAN|REJECT/.test(action)) return "kirmizi";
  if (/HIDE|OVERRIDE/.test(action)) return "sari";
  return "mavi";
}

export const ROZET_SINIFI: Record<RozetRengi, string> = {
  yesil: "bg-emerald-50 text-emerald-700 border-emerald-200",
  mavi: "bg-blue-50 text-blue-700 border-blue-200",
  kirmizi: "bg-red-50 text-red-700 border-red-200",
  sari: "bg-amber-50 text-amber-700 border-amber-200",
  mor: "bg-purple-50 text-purple-700 border-purple-200",
  gri: "bg-gray-100 text-gray-600 border-gray-200",
};

export const TARIH_SECENEKLERI = [
  { deger: "24s", etiket: "Son 24 saat", ms: 24 * 60 * 60 * 1000 },
  { deger: "7g", etiket: "Son 7 gün", ms: 7 * 24 * 60 * 60 * 1000 },
  { deger: "30g", etiket: "Son 30 gün", ms: 30 * 24 * 60 * 60 * 1000 },
  { deger: "tum", etiket: "Tüm zamanlar", ms: 0 },
] as const;

/** Tarih filtresinin alt sınırı; "tum" veya bilinmeyen değer için null. */
export function tarihAltSiniri(deger: string | undefined, simdi = Date.now()): Date | null {
  const s = TARIH_SECENEKLERI.find((t) => t.deger === deger);
  return s && s.ms > 0 ? new Date(simdi - s.ms) : null;
}

/** "11.10.2026 18:37" (saniyesiz, tr-TR). */
export function kisaZaman(d: Date): string {
  return d.toLocaleString("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}
