import { describe, it, expect, beforeAll } from "vitest";
import { encryptPhone, decryptPhone, phoneHash, normalizeTrMobile, maskedPhone, displayPhone } from "./phoneShareCrypto";

beforeAll(() => {
  process.env.AUTH_SECRET = "test-secret-test-secret-test-secret";
});

describe("normalizeTrMobile", () => {
  it("farklı yazımları aynı biçime çevirir", () => {
    for (const t of ["0532 123 45 67", "532 123 45 67", "+90 532 123 45 67", "0090 532-123-45-67", "(0532) 123.45.67", "905321234567", "5321234567"]) {
      expect(normalizeTrMobile(t), t).toEqual({ e164: "+905321234567", last2: "67" });
    }
  });

  it("cep numarası olmayanları reddeder", () => {
    for (const t of ["", "abc", "0212 123 45 67", "05321234", "053212345678", "0432 123 45 67", "+1 555 123 4567"]) {
      expect(normalizeTrMobile(t), t).toBeNull();
    }
  });
});

describe("gösterim biçimleri", () => {
  it("maskeler ve biçimlendirir", () => {
    expect(maskedPhone("67")).toBe("0 5•• ••• •• 67");
    expect(displayPhone("+905321234567")).toBe("0 532 123 45 67");
  });
});

describe("encryptPhone / decryptPhone", () => {
  it("aynı AAD ile çözer, her seferinde farklı çıktı üretir", () => {
    const a = encryptPhone("+905321234567", "12:34");
    const b = encryptPhone("+905321234567", "12:34");
    expect(a).not.toBe(b);
    expect(decryptPhone(a, "12:34")).toBe("+905321234567");
  });

  it("başka satırın AAD'siyle çözülmez", () => {
    const a = encryptPhone("+905321234567", "12:34");
    expect(() => decryptPhone(a, "12:99")).toThrow();
  });

  it("numara şifreli metinde düz görünmez", () => {
    expect(encryptPhone("+905321234567", "1:1")).not.toContain("5321234567");
  });
});

describe("phoneHash", () => {
  it("aynı numara aynı özeti verir, farklı numara farklı", () => {
    expect(phoneHash("+905321234567")).toBe(phoneHash("+905321234567"));
    expect(phoneHash("+905321234567")).not.toBe(phoneHash("+905321234568"));
  });
});
