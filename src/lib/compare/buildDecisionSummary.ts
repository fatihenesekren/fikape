// Karşılaştır sayfasının üst kısmında "bu karşılaştırmadan ne çıkarmalıyım"
// sorusuna cevap veren rozet şeridi için saf, deterministik hesaplama. Tek bir
// "kazanan" ilan ETMİYOR (öznel/yanıltıcı olurdu — biri performans ister, biri
// yakıt ekonomisi) — bunun yerine 3 ayrı, tek-boyutlu, doğrulanabilir gerçek.
//
// Not: "Fiyat" burada gerçek bir TL tutarı DEĞİL — Product şemasında fiyat alanı
// yok, scoreFiyat kullanıcıların fiyat/performans ALGISINI puanladığı bir
// boyut. Bu yüzden rozet "en uygun fiyatlı" değil "en yüksek fiyat/performans
// puanı" diyor — yanlış veri iddiası olmasın diye.
export interface DecisionBadge {
  label: string;
  vehicleLabel: string;
}

interface ProductScoreInput {
  label: string;
  overall: number | null;
  priceScore: number | null;
}

interface PowerRowInput {
  label: string;
  bestIndices: number[];
}

export function buildDecisionSummary(
  products: ProductScoreInput[],
  powerRow?: PowerRowInput
): DecisionBadge[] {
  const badges: DecisionBadge[] = [];

  const overallBest = pickUniqueBest(products.map((p) => p.overall));
  if (overallBest !== null) {
    badges.push({ label: "En yüksek kullanıcı puanı", vehicleLabel: products[overallBest].label });
  }

  const priceBest = pickUniqueBest(products.map((p) => p.priceScore));
  if (priceBest !== null) {
    badges.push({ label: "En yüksek fiyat/performans puanı", vehicleLabel: products[priceBest].label });
  }

  if (powerRow && powerRow.label === "Güç" && powerRow.bestIndices.length === 1) {
    badges.push({ label: "En güçlü", vehicleLabel: products[powerRow.bestIndices[0]].label });
  }

  return badges;
}

// En az 2 karşılaştırılabilir (null olmayan) değer yoksa "kazanan" ilan
// edilmiyor — tek değer varken "en iyi" demek anlamsız/yanıltıcı.
function pickUniqueBest(values: (number | null)[]): number | null {
  const present = values
    .map((v, i) => ({ v, i }))
    .filter((x): x is { v: number; i: number } => x.v !== null);
  if (present.length < 2) return null;
  const max = Math.max(...present.map((x) => x.v));
  const winners = present.filter((x) => x.v === max);
  return winners.length === 1 ? winners[0].i : null;
}
