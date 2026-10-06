import { describe, expect, it } from "vitest";
import { CACHE_ETIKETLERI, KATALOG_EK_ETIKETI, VERI_CACHE_ETIKETI, VITRIN_ETIKETI } from "./cacheEtiketleri";

describe("cache etiketleri", () => {
  it("üç etiketin hepsi listede", () => {
    expect([...CACHE_ETIKETLERI]).toEqual([VITRIN_ETIKETI, KATALOG_EK_ETIKETI, VERI_CACHE_ETIKETI]);
  });
  it("etiket adları kod tabanındaki değerlerle aynı", () => {
    expect(VITRIN_ETIKETI).toBe("vitrin");
    expect(KATALOG_EK_ETIKETI).toBe("katalog-ek");
    expect(VERI_CACHE_ETIKETI).toBe("veri-cache");
  });
  it("etiketler benzersiz", () => {
    expect(new Set(CACHE_ETIKETLERI).size).toBe(CACHE_ETIKETLERI.length);
  });
});
