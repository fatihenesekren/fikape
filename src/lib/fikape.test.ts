import { describe, it, expect } from "vitest";
import { calcOverall } from "./fikape";

describe("calcOverall", () => {
  it("FI×0.30 + KA×0.35 + PE×0.35 ağırlıklarını uygular", () => {
    const result = calcOverall({ scoreFiyat: 10, scoreKalite: 10, scorePerformans: 10 });
    expect(result).toBeCloseTo(10);
  });

  it("farklı puanları doğru ağırlıklandırır", () => {
    const result = calcOverall({ scoreFiyat: 8, scoreKalite: 6, scorePerformans: 4 });
    expect(result).toBeCloseTo(8 * 0.3 + 6 * 0.35 + 4 * 0.35);
  });

  it("en düşük puanlarda 1 döner", () => {
    const result = calcOverall({ scoreFiyat: 1, scoreKalite: 1, scorePerformans: 1 });
    expect(result).toBeCloseTo(1);
  });
});
