// Kullanım süresini (ay) okunabilir hale getirir — 12 ayı geçince "104 ay"
// gibi anlaşılması güç bir sayı yerine "8 yıl 8 ay" gösterir (bkz. kullanıcı
// geri bildirimi, ekran görüntüsü).
export function formatOwnershipDuration(months: number): string {
  if (months < 12) return `${months} ay`;
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;
  return remainingMonths > 0 ? `${years} yıl ${remainingMonths} ay` : `${years} yıl`;
}
