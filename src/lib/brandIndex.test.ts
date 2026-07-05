import { describe, it, expect } from "vitest";
import { calcShrunkScore, SHRINKAGE_M } from "./brandIndex";

describe("calcShrunkScore", () => {
  it("yorum sayısı 0 iken tamamen kategori ortalamasına eşittir", () => {
    expect(calcShrunkScore({ reviewCount: 0, rawAvg: 10, categoryAvg: 6 })).toBeCloseTo(6);
  });

  it("yorum sayısı m'ye eşitken raw ve kategori ortalamasının tam ortasıdır", () => {
    const result = calcShrunkScore({ reviewCount: SHRINKAGE_M, rawAvg: 10, categoryAvg: 6 });
    expect(result).toBeCloseTo(8);
  });

  it("çok yüksek yorum sayısında raw ortalamaya yaklaşır", () => {
    const result = calcShrunkScore({ reviewCount: 10000, rawAvg: 9, categoryAvg: 5 });
    expect(result).toBeCloseTo(9, 1);
  });

  it("1 yorumla zirveye çıkma senaryosunu engeller", () => {
    const oneReview = calcShrunkScore({ reviewCount: 1, rawAvg: 10, categoryAvg: 6 });
    const manyReviews = calcShrunkScore({ reviewCount: 50, rawAvg: 8, categoryAvg: 6 });
    expect(oneReview).toBeLessThan(manyReviews);
  });
});
