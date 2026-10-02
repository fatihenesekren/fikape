import { describe, expect, it } from "vitest";

describe("redisAnahtari", () => {
  it("ham IP/e-posta anahtarda görünmez, önek korunur, aynı girdi aynı anahtar", async () => {
    process.env.AUTH_SECRET = "test-secret-for-vitest"; // rateLimit → security import'u için
    const { redisAnahtari } = await import("./rateLimit");
    const a = redisAnahtari("compare-suggestions:94.235.142.115");
    expect(a.startsWith("ratelimit:compare-suggestions:")).toBe(true);
    expect(a).not.toContain("94.235");
    expect(redisAnahtari("compare-suggestions:94.235.142.115")).toBe(a);
    expect(redisAnahtari("compare-suggestions:94.235.142.116")).not.toBe(a);
    const e = redisAnahtari("login:kisi@ornek.com");
    expect(e).not.toContain("ornek");
    expect(e.startsWith("ratelimit:login:")).toBe(true);
  });
});
