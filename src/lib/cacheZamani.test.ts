import { describe, expect, it } from "vitest";
import { temizlemeZamaniEtiketi } from "./cacheZamani";

const simdi = new Date(2026, 9, 6, 18, 0);

describe("temizlemeZamaniEtiketi", () => {
  it("bugün", () => {
    expect(temizlemeZamaniEtiketi(new Date(2026, 9, 6, 14, 32), simdi)).toBe("bugün 14:32");
  });
  it("dün", () => {
    expect(temizlemeZamaniEtiketi(new Date(2026, 9, 5, 9, 5), simdi)).toBe("dün 09:05");
  });
  it("aynı yıl, daha eski", () => {
    const s = temizlemeZamaniEtiketi(new Date(2026, 8, 12, 14, 32), simdi);
    expect(s).toMatch(/^12 Eyl 14:32$/);
  });
  it("farklı yıl yılı gösterir", () => {
    const s = temizlemeZamaniEtiketi(new Date(2025, 8, 12, 14, 32), simdi);
    expect(s).toMatch(/2025 14:32$/);
  });
});
