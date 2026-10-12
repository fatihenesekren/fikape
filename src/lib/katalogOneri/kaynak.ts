// Kaynak güven kademesi — plan: A = resmî marka/distribütör sayfası, B = büyük otomotiv/haber yayını,
// C (forum, ilan, sosyal medya, yabancı basın) aday olamaz. Listeler bilinçli olarak kısa ve kolay düzenlenir.
import { adAnahtar } from "@/lib/katalog/ek";

export type Kademe = "A" | "B";

/** B kademesi: Türkiye'de lansman/fiyat haberi yapan büyük yayınlar ve ajanslar. */
export const MEDYA_B: readonly string[] = [
  "aa.com.tr", "dha.com.tr", "iha.com.tr",
  "hurriyet.com.tr", "milliyet.com.tr", "sabah.com.tr", "sozcu.com.tr", "ntv.com.tr", "haberturk.com", "cnnturk.com",
  "arabalar.com.tr", "otomerkezi.com.tr", "otogundem.com.tr", "tr.motor1.com",
  "donanimhaber.com", "shiftdelete.net", "webtekno.com", "otoajanda.com",
  // Teknoloji / tüketici yayınları (e-scooter, e-bisiklet, elektrikli motosiklet haberleri buradan çıkıyor)
  "technopat.net", "pchocasi.com.tr", "tekreferans.com", "otoaktuel.com.tr",
  // Ulusal gazete ve ekonomi yayınları
  "cumhuriyet.com.tr", "yenisafak.com", "takvim.com.tr", "dunya.com", "ekonomim.com", "gzt.com", "cnbce.com",
];

/** Hiçbir koşulda kabul edilmeyen kaynak türleri (A kuralındaki marka-alan adı eşleşmesini de keser). */
const REDDEDILEN = ["forum", "community", "sahibinden.", "arabam.com", "letgo", "facebook.", "instagram.", "youtube.", "reddit.", "eksisozluk", "twitter.", "x.com", "tiktok.",
  "hepsiburada.", "trendyol.", "n11.", "amazon.", "aliexpress.", "autoline", "mobile.de", "pinterest.", "linkedin."];

function hostVePath(url: string): { host: string; path: string } | null {
  try {
    const u = new URL(url);
    if (u.protocol !== "https:" && u.protocol !== "http:") return null;
    return { host: u.hostname.toLowerCase().replace(/^www\./, ""), path: u.pathname.toLowerCase() };
  } catch {
    return null;
  }
}

const hostEsles = (host: string, d: string) => host === d || host.endsWith(`.${d}`);

/**
 * URL + marka için kademe. null = aday olamaz (C ya da geçersiz).
 * A: alan adı markanın adını içerir VE Türkiye'ye ait (.tr uzantısı ya da /tr yolu).
 */
export function kaynakKademe(url: string, marka: string): Kademe | null {
  const p = hostVePath(url);
  if (!p) return null;
  if (REDDEDILEN.some((r) => p.host.includes(r))) return null;

  const markaKey = adAnahtar(marka).toLowerCase();
  const hostKey = p.host.replace(/[^a-z0-9]/g, "");
  // Türkiye sitesi: .tr uzantısı, /tr yolu ya da alan adında "turkiye/turkey" (örn. adriaturkiye.com dağıtıcı sitesi)
  const turkiyeSitesi = p.host.endsWith(".tr") || /^\/(tr|tr-tr)(\/|$)/.test(p.path) || /(turkiye|turkey)/.test(hostKey);
  if (markaKey.length >= 3 && hostKey.includes(markaKey) && turkiyeSitesi) {
    return "A";
  }
  if (MEDYA_B.some((d) => hostEsles(p.host, d))) return "B";
  return null;
}

/** Gemini'ye gitmeden önce gürültüyü (video, sosyal medya, pazaryeri, forum) ayıklar. */
export function kaynakUygunMu(url: string): boolean {
  const p = hostVePath(url);
  return !!p && !REDDEDILEN.some((r) => p.host.includes(r));
}

export function kaynakAdi(url: string): string | null {
  return hostVePath(url)?.host ?? null;
}

/** Türkiye'ye işaret: kaynak metninde ülke/satış ifadesi ya da .tr alan adı. */
export function turkiyeKaniti(url: string, metinNorm: string): boolean {
  const p = hostVePath(url);
  if (p?.host.endsWith(".tr")) return true;
  return /\b(turkiye|turkiyede|turk pazari|tl|yetkili satici|distributor|turkiye fiyat)\b/.test(metinNorm);
}
