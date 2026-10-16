import { afterEach, describe, expect, it } from "vitest";
import { leadTelefonuCoz, leadTelefonuSifrele, leadTelefonuYaz } from "./leadPhoneCrypto";

const ESKI = process.env.LEAD_PHONE_ENCRYPTION;
afterEach(() => { if (ESKI === undefined) delete process.env.LEAD_PHONE_ENCRYPTION; else process.env.LEAD_PHONE_ENCRYPTION = ESKI; });
process.env.AUTH_SECRET = "test-secret-test-secret-test-secret";

describe("leadPhoneCrypto", () => {
  it("şifreler ve çözer; her şifreleme farklı çıktı verir", () => {
    const a = leadTelefonuSifrele("05321234567");
    const b = leadTelefonuSifrele("05321234567");
    expect(a.startsWith("l1:")).toBe(true);
    expect(a).not.toContain("0532");
    expect(a).not.toBe(b);
    expect(leadTelefonuCoz(a)).toBe("05321234567");
  });
  it("öneksiz eski düz metin kayıtlar olduğu gibi okunur", () => {
    expect(leadTelefonuCoz("05321234567")).toBe("05321234567");
  });
  it("bozuk şifreli değerde yer tutucu döner, hata fırlatmaz", () => {
    expect(leadTelefonuCoz("l1:bozuk")).toBe("[çözülemedi]");
  });
  it("LEAD_PHONE_ENCRYPTION=1 değilse yazma düz metin kalır (kolon genişletilmeden şifreli yazma kırılmasın)", () => {
    delete process.env.LEAD_PHONE_ENCRYPTION;
    expect(leadTelefonuYaz("05321234567")).toBe("05321234567");
    process.env.LEAD_PHONE_ENCRYPTION = "1";
    expect(leadTelefonuYaz("05321234567").startsWith("l1:")).toBe(true);
  });
});
