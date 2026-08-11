import { describe, it, expect } from "vitest";
import { checkRateLimit } from "./rateLimit";

describe("checkRateLimit", () => {
  it("limitin altındaki istekleri kabul eder", async () => {
    const key = `test-${Math.random()}`;
    expect(await checkRateLimit(key, 3, 60_000)).toBe(true);
    expect(await checkRateLimit(key, 3, 60_000)).toBe(true);
    expect(await checkRateLimit(key, 3, 60_000)).toBe(true);
  });

  it("limit aşılınca reddeder", async () => {
    const key = `test-${Math.random()}`;
    await checkRateLimit(key, 2, 60_000);
    await checkRateLimit(key, 2, 60_000);
    expect(await checkRateLimit(key, 2, 60_000)).toBe(false);
  });

  it("pencere dolunca sıfırlar", async () => {
    const key = `test-${Math.random()}`;
    await checkRateLimit(key, 1, -1);
    expect(await checkRateLimit(key, 1, 60_000)).toBe(true);
  });

  it("farklı key'ler birbirinden bağımsızdır", async () => {
    const keyA = `a-${Math.random()}`;
    const keyB = `b-${Math.random()}`;
    await checkRateLimit(keyA, 1, 60_000);
    expect(await checkRateLimit(keyB, 1, 60_000)).toBe(true);
  });
});
