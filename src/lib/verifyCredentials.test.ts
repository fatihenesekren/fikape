import { beforeEach, describe, expect, it, vi } from "vitest";

const prismaMock = vi.hoisted(() => ({
  user: { findUnique: vi.fn(), update: vi.fn(async () => ({})) },
}));
vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));
vi.mock("bcryptjs", () => ({ default: { compare: vi.fn(async (p: string) => p === "dogru-parola") } }));
vi.mock("@/lib/accessLog", () => ({ logAccessRaw: vi.fn(async () => {}) }));
vi.mock("@/lib/sistemUyarisi", () => ({ girisHatasiYiginiKontrol: vi.fn(async () => {}) }));

import { verifyCredentials } from "./verifyCredentials";

const kullanici = (email: string) => ({
  id: 1, email, displayName: "Kurban", avatarUrl: null, trustLevel: 1, passwordHash: "h", passwordChangedAt: null,
  isBanned: false, inactiveSuspendedAt: null,
});

describe("verifyCredentials — hesap kilitleme koruması", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.AUTH_SECRET = "test-secret-test-secret-test-secret";
  });

  it("saldırganın kendi IP'siyle yaptığı yanlış denemeler kurbanı başka IP'den girişten alıkoymaz", async () => {
    const eposta = `kurban-${Math.random()}@example.com`;
    prismaMock.user.findUnique.mockResolvedValue(kullanici(eposta));
    for (let i = 0; i < 6; i++) expect(await verifyCredentials(eposta, "yanlis", "1.1.1.1")).toBeNull();
    // aynı (e-posta, IP) çifti artık kilitli: doğru parola bile geçmez
    expect(await verifyCredentials(eposta, "dogru-parola", "1.1.1.1")).toBeNull();
    // kurban kendi IP'sinden girebilir
    const sonuc = await verifyCredentials(eposta, "dogru-parola", "2.2.2.2");
    expect(sonuc?.email).toBe(eposta);
  });

  it("çok sayıda IP'den gelen dağıtık başarısız denemeler e-postayı kilitler (toplam 40/saat)", async () => {
    const eposta = `dagitik-${Math.random()}@example.com`;
    prismaMock.user.findUnique.mockResolvedValue(kullanici(eposta));
    for (let i = 0; i < 40; i++) await verifyCredentials(eposta, "yanlis", `10.0.${Math.floor(i / 200)}.${i + 1}`);
    expect(await verifyCredentials(eposta, "dogru-parola", "9.9.9.9")).toBeNull();
  });

  it("doğru parola başarısız sayaçı artırmaz", async () => {
    const eposta = `dogru-${Math.random()}@example.com`;
    prismaMock.user.findUnique.mockResolvedValue(kullanici(eposta));
    for (let i = 0; i < 4; i++) expect((await verifyCredentials(eposta, "dogru-parola", `8.8.8.${i}`))?.email).toBe(eposta);
  });
});
