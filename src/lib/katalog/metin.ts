// Kullanıcı/moderatör girdisi (marka, model, donanım) için ortak temizleyici ve doğrulayıcılar.
// Prisma'ya bağımlı değil; hem API'lerde hem testlerde kullanılır.

// Kontrol karakterleri, sıfır genişlikli ve çift yönlü (bidi) biçimlendirme karakterleri — Postgres \u0000'ı reddeder,
// bidi karakterleri görsel sahteciliğe (ör. ters yazılmış ad) yol açar.
const GIZLI_KARAKTERLER = /[\u0000-\u001F\u007F​-‏‪-‮⁦-⁩﻿]/g;

/** string değilse null; aksi halde NFC + gizli karakter temizliği + boşluk normalizasyonu. Uzunluğu KESMEZ. */
export function temizMetin(v: unknown): string | null {
  if (typeof v !== "string") return null;
  return v.normalize("NFC").replace(GIZLI_KARAKTERLER, "").replace(/\s+/g, " ").trim();
}

/** Yıl: yalnız 4 haneli sayı (number ya da "2020" string). "0x7E4", [2020], 2020.5 reddedilir. */
export function yilCoz(v: unknown): number | null | "gecersiz" {
  if (v === undefined || v === null || v === "") return null;
  if (typeof v === "number") return Number.isInteger(v) ? v : "gecersiz";
  if (typeof v === "string" && /^\d{4}$/.test(v.trim())) return Number(v.trim());
  return "gecersiz";
}

/** Yalnız https:// ve izinli bir sunucudan (Vercel Blob) gelen fotoğraf adresleri. */
export function fotoUrlGecerli(u: unknown, izinliSonekler: string[] = [".public.blob.vercel-storage.com"]): u is string {
  if (typeof u !== "string" || u.length > 500) return false;
  try {
    const url = new URL(u);
    return url.protocol === "https:" && izinliSonekler.some((s) => url.hostname.endsWith(s));
  } catch {
    return false;
  }
}
