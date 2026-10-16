import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { yuklenenGorseliDogrula } from "./yuklenenGorsel";

const dosya = (parcalar: BlobPart[], ad: string, tur: string) => new File(parcalar, ad, { type: tur });

describe("yuklenenGorseliDogrula", () => {
  it("geçerli görseli JPEG olarak yeniden kodlar", async () => {
    const png = await sharp({ create: { width: 8, height: 8, channels: 3, background: "#f00" } }).png().toBuffer();
    const r = await yuklenenGorseliDogrula(dosya([new Uint8Array(png)], "a.png", "image/png"));
    expect(r.ok).toBe(true);
    if (r.ok) expect((await sharp(r.buffer).metadata()).format).toBe("jpeg");
  });
  it("dosya yok, yanlış tür, büyük dosya ve sahte görseli reddeder", async () => {
    expect((await yuklenenGorseliDogrula(null)).ok).toBe(false);
    expect((await yuklenenGorseliDogrula(dosya(["<svg/>"], "a.svg", "image/svg+xml"))).ok).toBe(false);
    expect((await yuklenenGorseliDogrula(dosya([new Uint8Array(20)], "a.jpg", "image/jpeg"), 10)).ok).toBe(false);
    expect((await yuklenenGorseliDogrula(dosya(["<html><script>alert(1)</script></html>"], "a.jpg", "image/jpeg"))).ok).toBe(false);
  });
});
