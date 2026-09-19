// Karşılaştır sayfasının üst kısmında "bu karşılaştırmadan ne çıkarmalıyım"
// sorusuna cevap veren rozet şeridi için saf, deterministik hesaplama. Tek bir
// "kazanan" ilan ETMİYOR (öznel/yanıltıcı olurdu — biri performans ister, biri
// yakıt ekonomisi) — bunun yerine birkaç ayrı, tek-boyutlu, doğrulanabilir gerçek.
//
// Not: "Fiyat" burada gerçek bir TL tutarı DEĞİL — Product şemasında fiyat alanı
// yok, scoreFiyat kullanıcıların fiyat/performans ALGISINI puanladığı bir
// boyut. Bu yüzden rozet "en uygun fiyatlı" değil "en yüksek fiyat/performans
// puanı" diyor — yanlış veri iddiası olmasın diye.
//
// `source` her rozetin NEYE dayandığını UI'ya taşır — "review" (gerçek kullanıcı
// yorumu, sübjektif) ile "spec" (teknik özellik, ölçülebilir) kasıtlı olarak
// ayrı tutuluyor, ikisi karışırsa kullanıcı "kazanan" ile "sadece farklı"yı
// karıştırabilir (bkz. spec tablosundaki emerald/amber ayrımıyla aynı prensip).
export interface DecisionBadge {
  label: string;
  vehicleLabel: string;
  detail?: string;
  source: "review" | "spec" | "cta";
  href?: string;
}

interface ProductScoreInput {
  label: string;
  overall: number | null;
  priceScore: number | null;
  reviewCount: number;
}

interface SpecRowInput {
  label: string;
  values: (string | null)[];
  bestIndices: number[];
}

// Tek yorumlu bir ürünü "en yüksek puan" diye ilan etmek yanıltıcı — skoru
// tabloda yine görünür kalıyor, sadece burada öne çıkarılmıyor.
const MIN_REVIEWS_FOR_BADGE = 2;

const SPEC_BADGE_CANDIDATES: { label: string; badgeLabel: string }[] = [
  { label: "Güç", badgeLabel: "En güçlü" },
  { label: "0–100 km/s", badgeLabel: "En hızlı (0-100)" },
  { label: "Bagaj", badgeLabel: "En geniş bagaj" },
];

export function buildDecisionSummary(
  products: ProductScoreInput[],
  specRows: SpecRowInput[] = []
): DecisionBadge[] {
  const badges: DecisionBadge[] = [];

  const eligibleOverall = products.map((p) => (p.reviewCount >= MIN_REVIEWS_FOR_BADGE ? p.overall : null));
  const overallBest = pickUniqueBest(eligibleOverall);
  if (overallBest !== null) {
    const p = products[overallBest];
    badges.push({
      label: "En yüksek kullanıcı puanı",
      vehicleLabel: p.label,
      detail: `${p.overall!.toFixed(1)}/10 (${p.reviewCount} yorum)`,
      source: "review",
    });
  }

  const eligiblePrice = products.map((p) => (p.reviewCount >= MIN_REVIEWS_FOR_BADGE ? p.priceScore : null));
  const priceBest = pickUniqueBest(eligiblePrice);
  if (priceBest !== null) {
    const p = products[priceBest];
    badges.push({
      label: "En yüksek fiyat/performans puanı",
      vehicleLabel: p.label,
      detail: `${p.priceScore!.toFixed(1)}/10`,
      source: "review",
    });
  }

  // Öncelik sırası kasıtlı: kullanıcı deneyimi (yukarıda) > teknik özellik.
  // Toplamda en fazla 5 rozet (2 review + 3 spec) — daha fazlası gürültü olur.
  for (const candidate of SPEC_BADGE_CANDIDATES) {
    const row = specRows.find((r) => r.label === candidate.label);
    if (row && row.bestIndices.length === 1) {
      const i = row.bestIndices[0];
      badges.push({
        label: candidate.badgeLabel,
        vehicleLabel: products[i].label,
        detail: row.values[i] ?? undefined,
        source: "spec",
      });
    }
  }

  // Gösterilecek hiçbir rozet yoksa (yorum yok ve spec'lerde de net bir fark
  // yoksa) şerit tamamen boş kalmak yerine yorum yazmaya davet eden nötr bir
  // CTA gösteriyor.
  if (badges.length === 0) {
    badges.push({ label: "Henüz kullanıcı yorumu yok", vehicleLabel: "", source: "cta", href: "/yorum-yaz" });
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
