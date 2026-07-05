// Marka Endeksi — kategori bazlı, Bayesian shrinkage (IMDB weighted rating) formülü.
// Kararlar: bkz. proje hafızası "Fikape Marka Endeksi" — TEK marka geneli sayı yok,
// her kategori ayrı hesaplanır; az yorumlu kombinasyonlar kategori ortalamasına çekilir.

export const SHRINKAGE_M = 10;
export const MIN_TOTAL_REVIEWS_FOR_INDEX = 15;

export function calcShrunkScore({
  reviewCount,
  rawAvg,
  categoryAvg,
  m = SHRINKAGE_M,
}: {
  reviewCount: number;
  rawAvg: number;
  categoryAvg: number;
  m?: number;
}): number {
  if (reviewCount + m === 0) return categoryAvg;
  return (reviewCount / (reviewCount + m)) * rawAvg + (m / (reviewCount + m)) * categoryAvg;
}
