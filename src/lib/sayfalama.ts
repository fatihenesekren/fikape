// Sayfa numarası seçicisi için saf yardımcı: geçerli sayfanın çevresini ve uçları gösterir, arası "…" olur.
// Örn. toplam 12, geçerli 6 → [1, "…", 5, 6, 7, "…", 12]

export type SayfaOgesi = number | "…";

export function sayfaListesi(gecerli: number, toplam: number, yan = 1): SayfaOgesi[] {
  if (toplam <= 1) return toplam === 1 ? [1] : [];
  const g = Math.min(Math.max(1, Math.floor(gecerli) || 1), toplam);
  // İlk + son + geçerli ve iki yanı + iki "…" yuvası = 2*yan + 5 öğe; toplam bundan küçükse hepsi gösterilir
  if (toplam <= 2 * yan + 5) return Array.from({ length: toplam }, (_, i) => i + 1);

  const sol = Math.max(g - yan, 1);
  const sag = Math.min(g + yan, toplam);
  const solNokta = sol > 2;
  const sagNokta = sag < toplam - 1;

  const liste: SayfaOgesi[] = [];
  if (!solNokta) {
    // Başa yakın: 1..(2*yan+3) sonra … son
    const bitis = 2 * yan + 3;
    for (let i = 1; i <= bitis; i++) liste.push(i);
    liste.push("…", toplam);
  } else if (!sagNokta) {
    // Sona yakın: 1 … (toplam-(2*yan+2))..toplam
    liste.push(1, "…");
    for (let i = toplam - (2 * yan + 2); i <= toplam; i++) liste.push(i);
  } else {
    liste.push(1, "…");
    for (let i = sol; i <= sag; i++) liste.push(i);
    liste.push("…", toplam);
  }
  return liste;
}
