/**
 * Marka adını BÜYÜK harfe çevirir. Sayfa dili Türkçe olduğu için CSS `uppercase` "Giant"ı "GİANT" yapıyordu
 * (i → İ). Yabancı markalar İngilizce kurallarla (i → I), yerli markalar Türkçe kurallarla (i → İ) büyütülür.
 */
export function markaBuyuk(ad: string, yerli = false): string {
  return ad.toLocaleUpperCase(yerli ? "tr-TR" : "en-US");
}
