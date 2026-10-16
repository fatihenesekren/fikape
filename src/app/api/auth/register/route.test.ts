import { beforeEach, describe, expect, it, vi } from "vitest";

const prismaMock = vi.hoisted(() => ({
  user: { findUnique: vi.fn(), create: vi.fn() },
  consentLog: { create: vi.fn() },
}));
vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));
const rateLimitMock = vi.hoisted(() => ({ rateLimitByIp: vi.fn(async () => true), rateLimitByEmail: vi.fn(async () => true) }));
vi.mock("@/lib/rateLimit", () => rateLimitMock);
vi.mock("@/lib/emailToken", () => ({ createVerificationToken: vi.fn(() => "tok") }));
vi.mock("@/lib/email", () => ({ sendVerificationEmail: vi.fn(async () => {}), sendAccountExistsEmail: vi.fn(async () => {}) }));
vi.mock("@/lib/accessLog", () => ({ logAccess: vi.fn(async () => {}) }));
vi.mock("bcryptjs", () => ({ default: { hash: vi.fn(async () => "hash") } }));

import { POST } from "./route";

const govde = (extra: Record<string, unknown> = {}) => ({
  email: "yeni@example.com",
  password: "Guclu-Sifre-123",
  displayName: "Yeni Kullanıcı",
  kvkkConsent: true,
  termsConsent: true,
  ...extra,
});
const istek = (body: unknown) =>
  new Request("http://x/api/auth/register", {
    method: "POST",
    headers: { "content-type": "application/json", "user-agent": "vitest" },
    body: JSON.stringify(body),
  });

describe("kayıt: isteğe bağlı yorum paylaşım rızası", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.AUTH_SECRET = "test-secret-test-secret-test-secret";
    prismaMock.user.findUnique.mockResolvedValue(null);
    prismaMock.user.create.mockResolvedValue({ id: 42 });
    prismaMock.consentLog.create.mockResolvedValue({});
  });

  it("kutu işaretliyse verildi=true, sürüm ve hash'li IP ile kaydedilir", async () => {
    const res = await POST(istek(govde({ reviewShareConsent: true })));
    expect(res.status).toBe(201);
    const veri = prismaMock.consentLog.create.mock.calls[0][0].data;
    expect(veri).toMatchObject({ userId: 42, consentType: "REVIEW_DATA_SHARING", isGranted: true });
    expect(veri.consentVersion).toMatch(/^v\d+-/);
  });

  it("kutu işaretsiz ya da hiç gönderilmediyse verildi=false kaydedilir (reddetti ile hiç sorulmadı ayrılsın)", async () => {
    for (const extra of [{ reviewShareConsent: false }, {}]) {
      prismaMock.consentLog.create.mockClear();
      expect((await POST(istek(govde(extra)))).status).toBe(201);
      expect(prismaMock.consentLog.create.mock.calls[0][0].data).toMatchObject({ consentType: "REVIEW_DATA_SHARING", isGranted: false });
    }
  });

  it("zorunlu onaylar sözleşme satırlarıyla birlikte oluşturulur, rıza yazımı hata verse bile kayıt başarılı", async () => {
    prismaMock.consentLog.create.mockRejectedValue(new Error("enum yok"));
    const res = await POST(istek(govde({ reviewShareConsent: true })));
    expect(res.status).toBe(201);
    const kullanici = prismaMock.user.create.mock.calls[0][0].data;
    expect(kullanici.consentLogs.create.map((c: { consentType: string }) => c.consentType)).toEqual([
      "PRIVACY_POLICY",
      "TERMS_OF_SERVICE",
      "MEMBERSHIP_AGREEMENT",
    ]);
  });

  it("zorunlu KVKK onayı yoksa kayıt reddedilir ve hiçbir şey yazılmaz", async () => {
    const res = await POST(istek(govde({ kvkkConsent: false, reviewShareConsent: true })));
    expect(res.status).toBe(400);
    expect(prismaMock.user.create).not.toHaveBeenCalled();
    expect(prismaMock.consentLog.create).not.toHaveBeenCalled();
  });
});

describe("kayıt: e-posta numaralandırma koruması", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.AUTH_SECRET = "test-secret-test-secret-test-secret";
  });

  it("kayıtlı e-posta için de 201 döner, yeni hesap oluşturmaz ve sahibine bilgi e-postası gönderir", async () => {
    prismaMock.user.findUnique.mockResolvedValue({ id: 7, email: "yeni@example.com" });
    const { sendAccountExistsEmail } = await import("@/lib/email");
    const res = await POST(istek(govde()));
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ ok: true });
    expect(prismaMock.user.create).not.toHaveBeenCalled();
    await new Promise((r) => setTimeout(r, 0)); // arka plana bırakılan gönderim
    expect(sendAccountExistsEmail).toHaveBeenCalledWith("yeni@example.com");
  });

  it("adres başına limit aşılınca yine 201 döner ama e-posta gönderilmez (e-posta bombalama koruması)", async () => {
    prismaMock.user.findUnique.mockResolvedValue({ id: 7, email: "yeni@example.com" });
    rateLimitMock.rateLimitByEmail.mockResolvedValueOnce(false);
    const { sendAccountExistsEmail } = await import("@/lib/email");
    vi.mocked(sendAccountExistsEmail).mockClear();
    const res = await POST(istek(govde()));
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ ok: true });
    await new Promise((r) => setTimeout(r, 0));
    expect(sendAccountExistsEmail).not.toHaveBeenCalled();
  });
});
