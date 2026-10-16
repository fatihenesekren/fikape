import { beforeEach, describe, expect, it, vi } from "vitest";

const prismaMock = vi.hoisted(() => ({ user: { findUnique: vi.fn(), update: vi.fn() } }));
vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));
vi.mock("@/lib/rateLimit", () => ({ rateLimitByIp: vi.fn(async () => true) }));
vi.mock("@/lib/emailToken", () => ({ verifyPasswordResetToken: vi.fn(() => true) }));
vi.mock("bcryptjs", () => ({ default: { hash: vi.fn(async () => "yeni-hash") } }));

import { POST } from "./route";

const token = Buffer.from("7:abc").toString("base64url");
const istek = () =>
  new Request("http://x/api/auth/reset-password", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ token, password: "Zeytin#Bahce47" }),
  });

describe("reset-password: sahiplik kanıtı", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.user.update.mockResolvedValue({});
  });

  it("doğrulanmamış hesap sıfırlamayla doğrulanır ve oturumlar düşer (passwordChangedAt)", async () => {
    prismaMock.user.findUnique.mockResolvedValue({ id: 7, passwordHash: "eski", emailVerifiedAt: null, trustLevel: 1 });
    expect((await POST(istek())).status).toBe(200);
    const data = prismaMock.user.update.mock.calls[0][0].data;
    expect(data.emailVerifiedAt).toBeInstanceOf(Date);
    expect(data.trustLevel).toBe(2);
    expect(data.passwordChangedAt).toBeInstanceOf(Date);
    expect(data.passwordHash).toBe("yeni-hash");
  });

  it("zaten doğrulanmış hesabın doğrulama tarihi ve güven seviyesi değişmez", async () => {
    prismaMock.user.findUnique.mockResolvedValue({ id: 7, passwordHash: "eski", emailVerifiedAt: new Date(), trustLevel: 4 });
    expect((await POST(istek())).status).toBe(200);
    const data = prismaMock.user.update.mock.calls[0][0].data;
    expect("emailVerifiedAt" in data).toBe(false);
    expect("trustLevel" in data).toBe(false);
  });
});
