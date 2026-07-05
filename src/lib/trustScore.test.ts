import { describe, it, expect } from "vitest";
import { calcReviewerTrustMultiplier, calcTrustScore, TRUST_MULTIPLIER_MIN, TRUST_MULTIPLIER_MAX } from "./trustScore";

describe("calcReviewerTrustMultiplier", () => {
  it("Level 1 + garaj bağlantısı yok en düşük çarpanı verir", () => {
    expect(calcReviewerTrustMultiplier({ trustLevel: 1, garajLinked: false })).toBeCloseTo(0.75);
  });

  it("Level 3 + garaj bağlantısı üst sınıra takılır", () => {
    const result = calcReviewerTrustMultiplier({ trustLevel: 3, garajLinked: true });
    expect(result).toBeLessThanOrEqual(TRUST_MULTIPLIER_MAX);
    expect(result).toBeCloseTo(TRUST_MULTIPLIER_MAX);
  });

  it("bilinmeyen trustLevel (örn. 4) nötr kabul edilir", () => {
    expect(calcReviewerTrustMultiplier({ trustLevel: 4, garajLinked: false })).toBeCloseTo(0.9);
  });

  it("her zaman [0.7, 1.2] aralığında kalır", () => {
    for (const trustLevel of [1, 2, 3, 5]) {
      for (const garajLinked of [true, false]) {
        const result = calcReviewerTrustMultiplier({ trustLevel, garajLinked });
        expect(result).toBeGreaterThanOrEqual(TRUST_MULTIPLIER_MIN);
        expect(result).toBeLessThanOrEqual(TRUST_MULTIPLIER_MAX);
      }
    }
  });
});

describe("calcTrustScore", () => {
  it("en düşük gerçekleşen çarpanı (0.75) 10'a eşler", () => {
    expect(calcTrustScore({ trustLevel: 1, garajLinked: false })).toBe(10);
  });

  it("en yüksek çarpanı 100'e eşler", () => {
    expect(calcTrustScore({ trustLevel: 5, garajLinked: true })).toBe(100);
  });

  it("orta seviye kullanıcıya ara bir değer verir", () => {
    const score = calcTrustScore({ trustLevel: 2, garajLinked: false });
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThan(100);
  });
});
