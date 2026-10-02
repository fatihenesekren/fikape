import { describe, expect, it } from "vitest";
import { urunPasifMi, yeniEtkilesimeAcikMi } from "./urunDurumu";

describe("urunDurumu", () => {
  it("pasif = ACTIVE ve isActive=false", () => {
    expect(urunPasifMi({ status: "ACTIVE", isActive: false })).toBe(true);
    expect(urunPasifMi({ status: "ACTIVE", isActive: true })).toBe(false);
    expect(urunPasifMi({ status: "PENDING", isActive: false })).toBe(false);
  });
  it("yeni etkileşim: yayında ve bekleyen açık, pasif ve reddedilen kapalı", () => {
    expect(yeniEtkilesimeAcikMi({ status: "ACTIVE", isActive: true })).toBe(true);
    expect(yeniEtkilesimeAcikMi({ status: "PENDING", isActive: false })).toBe(true);
    expect(yeniEtkilesimeAcikMi({ status: "ACTIVE", isActive: false })).toBe(false);
    expect(yeniEtkilesimeAcikMi({ status: "REJECTED", isActive: false })).toBe(false);
  });
});
