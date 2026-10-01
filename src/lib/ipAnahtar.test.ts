import { afterEach, describe, expect, it, vi } from "vitest";

async function yukle(ipLogKey?: string) {
  vi.resetModules();
  process.env.AUTH_SECRET = "test-secret-for-vitest";
  if (ipLogKey) process.env.IP_LOG_KEY = ipLogKey; else delete process.env.IP_LOG_KEY;
  return await import("./security");
}

describe("IP şifreleme anahtar ayrımı", () => {
  afterEach(() => { delete process.env.IP_LOG_KEY; });

  it("IP_LOG_KEY yokken eski biçim (öneksiz) üretir ve çözer", async () => {
    const s = await yukle();
    const c = s.encryptIp("203.0.113.7");
    expect(c.startsWith("v2:")).toBe(false);
    expect(s.decryptIp(c)).toBe("203.0.113.7");
  });

  it("IP_LOG_KEY varken yeni kayıtlar v2 olur; eski kayıtlar hâlâ çözülür", async () => {
    const eski = (await yukle()).encryptIp("198.51.100.9");
    const s = await yukle("ayri-ip-anahtari");
    const yeni = s.encryptIp("203.0.113.7");
    expect(yeni.startsWith("v2:")).toBe(true);
    expect(s.decryptIp(yeni)).toBe("203.0.113.7");
    expect(s.decryptIp(eski)).toBe("198.51.100.9");
  });

  it("v2 kayıt, IP_LOG_KEY olmadan çözülemez (sessizce yanlış sonuç vermez)", async () => {
    const yeni = (await yukle("ayri-ip-anahtari")).encryptIp("203.0.113.7");
    const s = await yukle();
    expect(() => s.decryptIp(yeni)).toThrow();
  });

  it("getClientIp: x-vercel-forwarded-for, x-real-ip, X-Forwarded-For sırası", async () => {
    const s = await yukle();
    const h = (o: Record<string, string>) => new Request("http://x", { headers: o });
    expect(s.getClientIp(h({ "x-vercel-forwarded-for": "1.1.1.1", "x-forwarded-for": "6.6.6.6" }))).toBe("1.1.1.1");
    expect(s.getClientIp(h({ "x-real-ip": "2.2.2.2", "x-forwarded-for": "6.6.6.6" }))).toBe("2.2.2.2");
    expect(s.getClientIp(h({ "x-forwarded-for": "3.3.3.3, 4.4.4.4" }))).toBe("3.3.3.3");
    expect(s.getClientIp(h({}))).toBeNull();
  });
});
