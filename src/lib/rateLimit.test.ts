import { describe, it, expect } from "vitest";
import { checkRateLimit } from "./rateLimit";

describe("checkRateLimit", () => {
  it("limitin altındaki istekleri kabul eder", () => {
    const key = `test-${Math.random()}`;
    expect(checkRateLimit(key, 3, 60_000)).toBe(true);
    expect(checkRateLimit(key, 3, 60_000)).toBe(true);
    expect(checkRateLimit(key, 3, 60_000)).toBe(true);
  });

  it("limit aşılınca reddeder", () => {
    const key = `test-${Math.random()}`;
    checkRateLimit(key, 2, 60_000);
    checkRateLimit(key, 2, 60_000);
    expect(checkRateLimit(key, 2, 60_000)).toBe(false);
  });

  it("pencere dolunca sıfırlar", () => {
    const key = `test-${Math.random()}`;
    checkRateLimit(key, 1, -1);
    expect(checkRateLimit(key, 1, 60_000)).toBe(true);
  });

  it("farklı key'ler birbirinden bağımsızdır", () => {
    const keyA = `a-${Math.random()}`;
    const keyB = `b-${Math.random()}`;
    checkRateLimit(keyA, 1, 60_000);
    expect(checkRateLimit(keyB, 1, 60_000)).toBe(true);
  });
});
