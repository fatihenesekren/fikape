// /arama (ve /araclar?q=) girdisini güvenli hâle getirir ve sayfanın hangi durumda olduğuna TEK yerden karar verir.
// Saf fonksiyonlar (Prisma/sharp yok): sunucu sayfası, metadata ve istemci arama kutusu aynı kuralı kullanır.

/** Aramanın başlaması için en az karakter (trim sonrası). */
export const ARAMA_MIN_KARAKTER = 2;
/** Sorgu uzunluk sınırı — searchProducts.ts MAX_QUERY_LEN ile aynı değer. */
export const ARAMA_MAKS_KARAKTER = 128;

/**
 * Ham sorgu parametresini temizler: dizi gelirse (`?q=a&q=b`) ilk elemanı alır, metin değilse boş sayar;
 * kontrol karakterlerini (\u0000 dahil, Postgres'te hata verir) boşluğa çevirir; boşlukları sadeleştirir;
 * kırpar ve uzunluğu sınırlar.
 */
export function aramaTemizle(girdi: unknown): string {
  const ham = Array.isArray(girdi) ? girdi[0] : girdi;
  if (typeof ham !== "string") return "";
  return ham
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, ARAMA_MAKS_KARAKTER)
    .trim();
}

export type AramaDurum = "bos" | "kisa" | "sonuc";

/** bos: hiç yazılmamış · kisa: 1 karakter (arama başlamaz, ipucu gösterilir) · sonuc: aranabilir. */
export function aramaDurumu(girdi: unknown): { durum: AramaDurum; q: string } {
  const q = aramaTemizle(girdi);
  if (q.length === 0) return { durum: "bos", q };
  if (q.length < ARAMA_MIN_KARAKTER) return { durum: "kisa", q };
  return { durum: "sonuc", q };
}

/** Çip tıklaması gibi organik olmayan girişleri ayırmak için `k` parametresi (arama kaydında ayrı kaynak). */
export function aramaKaynagi(girdi: unknown): "cip" | "arama" {
  const ham = Array.isArray(girdi) ? girdi[0] : girdi;
  return ham === "cip" ? "cip" : "arama";
}
