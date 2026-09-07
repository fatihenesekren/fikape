// Bir min/max aralığını okunabilir metne çevirir — tek taraf boşsa "…" gibi
// anlaşılması güç bir gösterim yerine "X ve üzeri"/"X ve altı" (bkz. kullanıcı
// geri bildirimi, takas ilanı beklentileri ekran görüntüsü). İkisi de doluysa
// "min–max" gösterimi değişmiyor.
export function formatRange(min: number | null, max: number | null, fmt: (n: number) => string): string {
  if (min != null && max != null) return `${fmt(min)}–${fmt(max)}`;
  if (min != null) return `${fmt(min)} ve üzeri`;
  if (max != null) return `${fmt(max)} ve altı`;
  return "";
}
