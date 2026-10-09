import { describe, expect, it } from "vitest";
import { ARAC_HAVUZU_ETIKETI, CACHE_ETIKETLERI, GORSEL_KAYNAK_ETIKETI, KATALOG_EK_ETIKETI, VERI_CACHE_ETIKETI, VITRIN_ETIKETI } from "./cacheEtiketleri";

describe("cache etiketleri", () => {
  it("dört etiketin hepsi listede", () => {
    expect([...CACHE_ETIKETLERI]).toEqual([VITRIN_ETIKETI, KATALOG_EK_ETIKETI, VERI_CACHE_ETIKETI, GORSEL_KAYNAK_ETIKETI, ARAC_HAVUZU_ETIKETI]);
  });
  it("etiket adları kod tabanındaki değerlerle aynı", () => {
    expect(VITRIN_ETIKETI).toBe("vitrin");
    expect(KATALOG_EK_ETIKETI).toBe("katalog-ek");
    expect(VERI_CACHE_ETIKETI).toBe("veri-cache");
    expect(GORSEL_KAYNAK_ETIKETI).toBe("gorsel-kaynaklari");
  });
  it("etiketler benzersiz", () => {
    expect(new Set(CACHE_ETIKETLERI).size).toBe(CACHE_ETIKETLERI.length);
  });
});
