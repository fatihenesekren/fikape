import { describe, it, expect } from "vitest";
import { encodeQuiz, decodeQuiz, calcQuizScore, type QuizAnswers } from "./quiz";

describe("encodeQuiz / decodeQuiz", () => {
  it("round-trip yapar", () => {
    const answers: QuizAnswers = { cat: "oto", q2: "sehir", q3: "bakim" };
    expect(decodeQuiz(encodeQuiz(answers))).toEqual(answers);
  });

  it("geçersiz kategoriyi reddeder", () => {
    expect(decodeQuiz("gecersiz,sehir,bakim")).toBeNull();
  });

  it("eksik parçaları reddeder", () => {
    expect(decodeQuiz("oto,sehir")).toBeNull();
  });

  it("boş q2/q3'ü reddeder", () => {
    expect(decodeQuiz("oto,,bakim")).toBeNull();
  });
});

describe("calcQuizScore", () => {
  const scores = { scoreFiyat: 8, scoreKalite: 6, scorePerformans: 4 };

  it("oto dışı kategorilerde review eşleştirmesi yapmaz", () => {
    const result = calcQuizScore(scores, [{ usage_type: "city" }], { cat: "moto", q2: "sehir", q3: "guven" });
    expect(result.matchCount).toBe(0);
    expect(result.isRealMatch).toBe(false);
  });

  it("q3=bakim iken fiyat+kalite ağırlıklı skor hesaplar", () => {
    const result = calcQuizScore(scores, [], { cat: "oto", q2: "sehir", q3: "bakim" });
    expect(result.score).toBeCloseTo(8 * 0.5 + 6 * 0.5);
  });

  it("3'ten az eşleşme varsa isRealMatch false döner", () => {
    const result = calcQuizScore(
      scores,
      [{ usage_type: "city" }, { usage_type: "city" }],
      { cat: "oto", q2: "sehir", q3: "guven" }
    );
    expect(result.matchCount).toBe(2);
    expect(result.isRealMatch).toBe(false);
  });

  it("3+ eşleşme varsa isRealMatch true döner", () => {
    const reviews = [{ usage_type: "city" }, { usage_type: "city" }, { usage_type: "city" }];
    const result = calcQuizScore(scores, reviews, { cat: "oto", q2: "sehir", q3: "guven" });
    expect(result.matchCount).toBe(3);
    expect(result.isRealMatch).toBe(true);
  });

  it("uyumsuz usage_type'ları eleyerek eşleştirir", () => {
    const reviews = [{ usage_type: "city" }, { usage_type: "highway" }, { usage_type: "city" }];
    const result = calcQuizScore(scores, reviews, { cat: "oto", q2: "sehir", q3: "guven" });
    expect(result.matchCount).toBe(2);
  });
});
