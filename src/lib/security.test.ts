import { describe, it, expect, beforeAll } from "vitest";
import type { hashRequestContext as HashRequestContext } from "./security";

let hashRequestContext: typeof HashRequestContext;

beforeAll(async () => {
  process.env.AUTH_SECRET = "test-secret-for-vitest";
  ({ hashRequestContext } = await import("./security"));
});

function makeRequest(headers: Record<string, string>): Request {
  return new Request("https://fikape.com/api/reviews", { headers });
}

describe("hashRequestContext", () => {
  it("x-forwarded-for'daki ilk IP'yi kullanır", () => {
    const a = hashRequestContext(makeRequest({ "x-forwarded-for": "1.2.3.4, 5.6.7.8" }));
    const b = hashRequestContext(makeRequest({ "x-forwarded-for": "1.2.3.4" }));
    expect(a.ipHash).toBe(b.ipHash);
  });

  it("x-forwarded-for yoksa x-real-ip'e düşer", () => {
    const result = hashRequestContext(makeRequest({ "x-real-ip": "9.9.9.9" }));
    expect(result.ipHash).not.toBeNull();
  });

  it("hiç IP başlığı yoksa null döner", () => {
    const result = hashRequestContext(makeRequest({}));
    expect(result.ipHash).toBeNull();
    expect(result.userAgentHash).toBeNull();
  });

  it("farklı IP'ler farklı hash üretir", () => {
    const a = hashRequestContext(makeRequest({ "x-forwarded-for": "1.1.1.1" }));
    const b = hashRequestContext(makeRequest({ "x-forwarded-for": "2.2.2.2" }));
    expect(a.ipHash).not.toBe(b.ipHash);
  });

  it("ham IP'yi asla hash'in içine düz metin olarak koymaz", () => {
    const result = hashRequestContext(makeRequest({ "x-forwarded-for": "203.0.113.42" }));
    expect(result.ipHash).not.toContain("203.0.113.42");
  });

  it("user-agent'ı hash'ler", () => {
    const result = hashRequestContext(makeRequest({ "user-agent": "Mozilla/5.0 Test" }));
    expect(result.userAgentHash).toMatch(/^[0-9a-f]{64}$/);
  });
});
