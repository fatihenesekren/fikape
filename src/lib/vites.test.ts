import { describe, expect, it } from "vitest";
import { vitesEtiketi } from "./vites";

describe("vitesEtiketi", () => {
  it("bilinen değerleri tek biçime çevirir", () => {
    expect(vitesEtiketi("Manuel")).toBe("Manuel");
    expect(vitesEtiketi("manuel")).toBe("Manuel");
    expect(vitesEtiketi("OTOMATİK")).toBe("Otomatik");
    expect(vitesEtiketi("otomatik")).toBe("Otomatik");
    expect(vitesEtiketi("cvt")).toBe("CVT");
    expect(vitesEtiketi("Yarı Otomatik")).toBe("Yarı Otomatik");
    expect(vitesEtiketi("yari otomatik")).toBe("Yarı Otomatik");
  });
  it("boş veya bilinmeyen değerde null", () => {
    expect(vitesEtiketi(undefined)).toBeNull();
    expect(vitesEtiketi(null)).toBeNull();
    expect(vitesEtiketi("")).toBeNull();
    expect(vitesEtiketi("6")).toBeNull();
    expect(vitesEtiketi("dsg")).toBeNull();
  });
});
