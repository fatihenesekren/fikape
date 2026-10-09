import { describe, expect, it } from "vitest";
import { KATEGORILER, KATEGORI_SLUGLARI, kategoriHref } from "./kategoriler";

describe("kategoriler", () => {
  it("6 benzersiz kategori", () => {
    expect(KATEGORILER).toHaveLength(6);
    expect(new Set(KATEGORI_SLUGLARI).size).toBe(6);
  });
  it("href slug'ı kodlar", () => {
    expect(kategoriHref("e-bisiklet")).toBe("/araclar?kategori=e-bisiklet");
    expect(kategoriHref("a b")).toBe("/araclar?kategori=a%20b");
  });
});
