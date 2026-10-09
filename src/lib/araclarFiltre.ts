// /araclar filtre seçimlerinin saf yardımcıları (Prisma yok): adres parametresi ayrıştırma ve
// "sonuç vermeyen seçimleri ayıklama".

import { productMatchesFacets, type FacetGroup } from "@/lib/vehicleFacets";

/** "a,b,,a" → ["a","b"] (kırpılır, boşlar atılır, tekrarlar düşer, sıra korunur). */
export function listeParametresi(raw: string | undefined | null): string[] {
  if (!raw) return [];
  const out: string[] = [];
  for (const parca of raw.split(",")) {
    const v = parca.trim();
    if (v && !out.includes(v)) out.push(v);
  }
  return out;
}

type Urun = { attributes: unknown; brand: { slug: string } };

/**
 * Seçili özellik değerlerinden, mevcut durumda HİÇ sonuç vermeyenleri ayıklar.
 *
 * Kural: gruplar yukarıdan aşağıya işlenir ve üstteki seçim kazanır. Bir değer, "seçili markalar + kendisinden
 * ÖNCEKİ (üstteki) grupların kalan seçimleri" kapsamında en az bir ürünle eşleşiyorsa korunur; aksi hâlde düşer.
 * Bilinmeyen değerler (o kategoride seçeneği olmayanlar) ve görünür grupta olmayan anahtarlar da düşer.
 * Marka değiştirince sonuç vermeyecek alt filtreler böylece temizlenir; sonuç veren seçimler korunur.
 */
export function sonucVermeyenSecimleriAyikla(
  urunler: Urun[],
  gruplar: FacetGroup[],
  markalar: string[],
  secili: Record<string, string[]>,
): Record<string, string[]> {
  const markaKapsami = markalar.length ? urunler.filter((p) => markalar.includes(p.brand.slug)) : urunler;
  const kalan: Record<string, string[]> = {};
  for (const g of gruplar) {
    const istenen = secili[g.key] ?? [];
    if (istenen.length === 0) continue;
    const kapsam = markaKapsami.filter((p) => productMatchesFacets(p.attributes as Record<string, unknown>, gruplar, kalan));
    const korunan = istenen.filter((deger) => {
      const secenek = g.options.find((o) => o.value === deger);
      return !!secenek && kapsam.some((p) => secenek.match(p.attributes as Record<string, unknown>));
    });
    if (korunan.length) kalan[g.key] = korunan;
  }
  return kalan;
}
