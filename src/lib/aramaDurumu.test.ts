import { describe, expect, it } from "vitest";
import { ARAMA_MAKS_KARAKTER, aramaDurumu, aramaKaynagi, aramaTemizle } from "./aramaDurumu";

describe("aramaDurumu", () => {
  it("boş, tanımsız, boşluk-only → bos", () => {
    expect(aramaDurumu(undefined)).toEqual({ durum: "bos", q: "" });
    expect(aramaDurumu("")).toEqual({ durum: "bos", q: "" });
    expect(aramaDurumu("   ")).toEqual({ durum: "bos", q: "" });
    expect(aramaDurumu(null)).toEqual({ durum: "bos", q: "" });
    expect(aramaDurumu(42)).toEqual({ durum: "bos", q: "" });
  });
  it("1 karakter (kırpılmış) → kisa, girdi korunur", () => {
    expect(aramaDurumu("a")).toEqual({ durum: "kisa", q: "a" });
    expect(aramaDurumu("  a  ")).toEqual({ durum: "kisa", q: "a" });
    expect(aramaDurumu("İ").durum).toBe("kisa");
  });
  it("2+ karakter → sonuc", () => {
    expect(aramaDurumu("ab")).toEqual({ durum: "sonuc", q: "ab" });
    expect(aramaDurumu("İİ").durum).toBe("sonuc");
    expect(aramaDurumu("  bmw   320 ")).toEqual({ durum: "sonuc", q: "bmw 320" });
  });
  it("dizi girdisi (?q=a&q=b) çökmez, ilk elemanı alır", () => {
    expect(aramaDurumu(["fiat", "tesla"])).toEqual({ durum: "sonuc", q: "fiat" });
    expect(aramaDurumu(["a", "bb"])).toEqual({ durum: "kisa", q: "a" });
    expect(aramaDurumu([])).toEqual({ durum: "bos", q: "" });
    expect(aramaDurumu([1, 2])).toEqual({ durum: "bos", q: "" });
  });
  it("kontrol karakterleri (\\u0000 dahil) boşluğa çevrilir", () => {
    expect(aramaTemizle("a\u0000b")).toBe("a b");
    expect(aramaTemizle("a\tb\nc")).toBe("a b c");
    expect(aramaTemizle("\u0000\u0001")).toBe("");
    expect(aramaDurumu("\u0000a")).toEqual({ durum: "kisa", q: "a" });
  });
  it("LIKE metakarakterleri ve ters eğik çizgi dokunulmadan geçer (kaçırma arama katmanında)", () => {
    expect(aramaTemizle("100%_x\\")).toBe("100%_x\\");
  });
  it("uzun sorgu 128 karaktere kısaltılır", () => {
    const uzun = "a".repeat(500);
    expect(aramaTemizle(uzun)).toHaveLength(ARAMA_MAKS_KARAKTER);
    expect(aramaDurumu(uzun).durum).toBe("sonuc");
  });
  it("çip kaynağı yalnız k=cip ile (dizi dahil) tanınır", () => {
    expect(aramaKaynagi("cip")).toBe("cip");
    expect(aramaKaynagi(["cip", "x"])).toBe("cip");
    expect(aramaKaynagi("x")).toBe("arama");
    expect(aramaKaynagi(undefined)).toBe("arama");
  });
});
