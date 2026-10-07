import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({ prisma: {} }));
vi.mock("@vercel/blob", () => ({ del: vi.fn() }));

import { silinecekEskiGorsel } from "./urunGorselTemizlik";

const H = "https://abc123.public.blob.vercel-storage.com";

describe("silinecekEskiGorsel", () => {
  it("eski blur dosyası yeni blur yüklenince silinir", () => {
    expect(silinecekEskiGorsel(`${H}/product-images/a-blurred-1.jpg`, `${H}/product-images/a-blurred-2.jpg`))
      .toBe(`${H}/product-images/a-blurred-1.jpg`);
  });
  it("sürüm parametresi atılır", () => {
    expect(silinecekEskiGorsel(`${H}/product-images/a.jpg?v=5`, `${H}/product-images/a-blurred-2.jpg`))
      .toBe(`${H}/product-images/a.jpg`);
  });
  it("yeni dosya aynı yolsa (üzerine yazma) silinmez", () => {
    expect(silinecekEskiGorsel(`${H}/product-images/a.jpg?v=1`, `${H}/product-images/a.jpg?v=2`)).toBeNull();
  });
  it("dış adres (hotlink) silinmez", () => {
    expect(silinecekEskiGorsel("https://upload.wikimedia.org/x/a.jpg", `${H}/product-images/a.jpg`)).toBeNull();
  });
  it("product-images dışındaki blob dosyası silinmez", () => {
    expect(silinecekEskiGorsel(`${H}/trade-photos/a.jpg`, `${H}/product-images/a.jpg`)).toBeNull();
  });
  it("eski adres yoksa ya da bozuksa null", () => {
    expect(silinecekEskiGorsel(null, `${H}/product-images/a.jpg`)).toBeNull();
    expect(silinecekEskiGorsel("bozuk", `${H}/product-images/a.jpg`)).toBeNull();
  });
});
