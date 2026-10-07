import { del } from "@vercel/blob";
import { prisma } from "@/lib/prisma";

const BLOB_HOST_SONEKI = ".public.blob.vercel-storage.com";
const ONEK = "/product-images/";

function yol(url: string): { origin: string; pathname: string } | null {
  try {
    const u = new URL(url);
    if (!u.hostname.endsWith(BLOB_HOST_SONEKI)) return null;
    return { origin: u.origin, pathname: decodeURIComponent(u.pathname) };
  } catch {
    return null;
  }
}

/**
 * Yeni görsel kaydedilince eski dosyanın silinip silinmeyeceğine karar verir.
 * Yalnız kendi Blob deposundaki `product-images/` dosyaları silinir; dış adreslere (hotlink) ve
 * yeni dosyayla aynı yola (üzerine yazılan `<slug>.jpg`) dokunulmaz. Silinecek adresi, yoksa null döner.
 */
export function silinecekEskiGorsel(eskiUrl: string | null | undefined, yeniUrl: string): string | null {
  if (!eskiUrl) return null;
  const eski = yol(eskiUrl);
  const yeni = yol(yeniUrl);
  if (!eski || !eski.pathname.startsWith(ONEK)) return null;
  if (yeni && yeni.pathname === eski.pathname) return null;
  return eski.origin + eski.pathname;
}

/**
 * Görsel değişiminden SONRA çağrılır (DB güncellendikten sonra). En iyi çaba: hata verirse sessizce geçer,
 * yeni görsel zaten kayıtlı. Başka bir ürün hâlâ aynı dosyayı gösteriyorsa silmez.
 */
export async function eskiUrunGorseliniSil(urunId: number, eskiUrl: string | null | undefined, yeniUrl: string): Promise<void> {
  try {
    const hedef = silinecekEskiGorsel(eskiUrl, yeniUrl);
    if (!hedef) return;
    const pathname = new URL(hedef).pathname;
    const baska = await prisma.product.count({ where: { id: { not: urunId }, imageUrl: { contains: pathname } } });
    if (baska > 0) return;
    await del(hedef);
  } catch (e) {
    console.error("[urun-gorsel-temizlik]", e);
  }
}
