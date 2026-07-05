// Yorumcu güven çarpanı — TrustLevel + Garaj tutarlılığına göre 0.7x-1.2x
// arasında bir çarpan üretir, bu çarpan trustScore (0-100) alanına eşlenir.
// Kapsam kararı: şu an sadece Review.trustScore'u besliyor (ScoreSnapshot'a
// yazılıyor, admin'de görülebilir) — ürün sayfasındaki gösterilen ortalama
// puan (agg._avg.scoreOverall) hâlâ düz aritmetik ortalama, ağırlıklı
// ortalamaya geçiş ayrı bir karar turu.

export const TRUST_MULTIPLIER_MIN = 0.7;
export const TRUST_MULTIPLIER_MAX = 1.2;

// TrustLevel: 1=Üye, 2=Doğrulanmış, 3=Fotoğraf Doğrulamalı, 5=Admin (4 boş)
const TRUST_LEVEL_ADJUSTMENT: Record<number, number> = {
  1: -0.15,
  2: 0,
  3: 0.15,
  5: 0.2,
};

const GARAJ_LINKED_BONUS = 0.1;
const GARAJ_UNLINKED_PENALTY = -0.1;

export function calcReviewerTrustMultiplier({
  trustLevel,
  garajLinked,
}: {
  trustLevel: number;
  garajLinked: boolean;
}): number {
  const levelAdjustment = TRUST_LEVEL_ADJUSTMENT[trustLevel] ?? 0;
  const garajAdjustment = garajLinked ? GARAJ_LINKED_BONUS : GARAJ_UNLINKED_PENALTY;
  const multiplier = 1 + levelAdjustment + garajAdjustment;
  return Math.min(TRUST_MULTIPLIER_MAX, Math.max(TRUST_MULTIPLIER_MIN, multiplier));
}

export function calcTrustScore(params: { trustLevel: number; garajLinked: boolean }): number {
  const multiplier = calcReviewerTrustMultiplier(params);
  const normalized = (multiplier - TRUST_MULTIPLIER_MIN) / (TRUST_MULTIPLIER_MAX - TRUST_MULTIPLIER_MIN);
  return Math.round(normalized * 100);
}
