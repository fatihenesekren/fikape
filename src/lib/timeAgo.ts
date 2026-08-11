// Basit Türkçe göreli zaman etiketi ("3 gün önce" gibi). RecentReviews.tsx'teki
// yerel daysSince kalıbıyla aynı mantık, birden fazla yerde kullanıldığı için
// (Takas ilan kartı/detayı) paylaşılan bir yardımcıya çıkarıldı.
export function timeAgoTr(date: Date): string {
  const days = Math.floor((Date.now() - date.getTime()) / 86_400_000);
  if (days <= 0) return "bugün";
  if (days === 1) return "dün";
  if (days < 30) return `${days} gün önce`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} ay önce`;
  const years = Math.floor(months / 12);
  return `${years} yıl önce`;
}
