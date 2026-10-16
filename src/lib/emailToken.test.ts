import { beforeAll, describe, expect, it } from "vitest";

beforeAll(() => {
  process.env.AUTH_SECRET = "test-secret-test-secret-test-secret";
  delete process.env.EMAIL_TOKEN_SECRET;
});

describe("emailToken", () => {
  it("doğrulama token'ı doğrulanır, bozuk token reddedilir", async () => {
    const { createVerificationToken, verifyEmailToken } = await import("./emailToken");
    const t = createVerificationToken(42);
    expect(verifyEmailToken(t)).toEqual({ userId: 42 });
    expect(verifyEmailToken(t.slice(0, -3) + "xxx")).toBeNull();
    expect(verifyEmailToken("bozuk")).toBeNull();
  });

  it("şifre sıfırlama token'ı parola hash'ine bağlıdır (tek kullanımlık)", async () => {
    const { createPasswordResetToken, verifyPasswordResetToken } = await import("./emailToken");
    const t = createPasswordResetToken(7, "eski-hash");
    expect(verifyPasswordResetToken(t, "eski-hash")).toEqual({ userId: 7 });
    expect(verifyPasswordResetToken(t, "yeni-hash")).toBeNull();
  });

  it("token türleri birbirinin yerine kullanılamaz", async () => {
    const m = await import("./emailToken");
    expect(m.verifyEmailToken(m.createPasswordResetToken(7, "h"))).toBeNull();
    expect(m.verifyPasswordResetToken(m.createVerificationToken(7), "h")).toBeNull();
  });
});
