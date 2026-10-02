import { describe, expect, it } from "vitest";
import { wikimediaGenislet } from "./wikimediaThumb";

describe("wikimediaGenislet", () => {
  const kucuk = "https://upload.wikimedia.org/wikipedia/commons/thumb/8/83/Renault_Zoe_%28Facelift%29_f.jpg/330px-Renault_Zoe_%28Facelift%29_f.jpg";
  it("330px küçük resmi 960px'e büyütür, dosya adı/parantez aynen kalır", () => {
    expect(wikimediaGenislet(kucuk)).toBe(kucuk.replace("/330px-", "/960px-"));
  });
  it("zaten büyük, thumb olmayan, başka host ve boş girdiyi değiştirmez", () => {
    const buyuk = kucuk.replace("/330px-", "/1280px-");
    expect(wikimediaGenislet(buyuk)).toBe(buyuk);
    const orijinal = "https://upload.wikimedia.org/wikipedia/commons/8/83/Renault_Zoe.jpg";
    expect(wikimediaGenislet(orijinal)).toBe(orijinal);
    const baska = "https://example.com/thumb/a/330px-x.jpg";
    expect(wikimediaGenislet(baska)).toBe(baska);
    expect(wikimediaGenislet(null)).toBeNull();
    expect(wikimediaGenislet("bozuk adres")).toBe("bozuk adres");
  });
});
