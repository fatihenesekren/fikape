import { describe, expect, it } from "vitest";
import { urunSlugTabani, urunSlugu } from "./urunDogrula";

describe("urunSlugu — yeni kayıt adresi", () => {
  const baz = urunSlugTabani("BYD", "Seal U", "DM-i 1.5 – Design", 2024);

  it("taban boşsa vites verilse de adres tabanın kendisidir (sapma yok)", () => {
    expect(baz).toBe("byd-seal-u-dm-i-1-5-design-2024");
    expect(urunSlugu(baz, "Otomatik", false)).toBe(baz);
    expect(urunSlugu(baz, null, false)).toBe(baz);
    expect(urunSlugu(baz, undefined, false)).toBe(baz);
  });

  it("taban doluysa ve vites verilmişse vites soneki eklenir (aynı ad/yıl, farklı vites)", () => {
    expect(urunSlugu(baz, "Manuel", true)).toBe(`${baz}-manuel`);
    expect(urunSlugu(baz, "Yarı Otomatik", true)).toBe(`${baz}-yari-otomatik`);
  });

  it("taban doluysa ve vites yoksa taban döner (çakışma çağıran tarafta 409 olur)", () => {
    expect(urunSlugu(baz, null, true)).toBe(baz);
  });
});
