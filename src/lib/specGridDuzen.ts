import type { SpecItem } from "@/lib/buildSpecList";

// Teknik özellik kutucukları 3 sütunlu ızgarada tek sütun genişliğindedir; değeri uzun olan bir kutu satırlara
// bölünüp yükselince aynı satırdaki komşu kutular da boşlukla uzuyordu (örn. karavan "Yatak Düzeni").
// Çözüm: değeri bu eşikten uzun kutular, kısa kutuların ARDINDAN ızgaranın tam genişliğinde gösterilir.
export const UZUN_DEGER_ESIGI = 28;

/** Kısa ve uzun değerli kutuları ayırır; her grupta özgün sıra korunur. Uzunluk Unicode karakter sayısıyla ölçülür. */
export function kisaUzunAyir(items: SpecItem[], esik: number = UZUN_DEGER_ESIGI): { kisa: SpecItem[]; uzun: SpecItem[] } {
  const kisa: SpecItem[] = [];
  const uzun: SpecItem[] = [];
  for (const it of items) {
    ([...it.value].length > esik ? uzun : kisa).push(it);
  }
  return { kisa, uzun };
}
