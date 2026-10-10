import { describe, expect, it, vi } from "vitest";
import sharp from "sharp";

vi.mock("next/cache", () => ({ unstable_cache: (fn: unknown) => fn }));

import { siniflandirBuffer, siniflandirRaw } from "./imageBackdrop";

const N = 32;
const duz = (r: number, g: number, b: number) => {
  const d = Buffer.alloc(N * N * 3);
  for (let i = 0; i < N * N; i++) { d[i * 3] = r; d[i * 3 + 1] = g; d[i * 3 + 2] = b; }
  return d;
};
const boya = (d: Buffer, x0: number, y0: number, w: number, h: number, v: number) => {
  for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) { const i = (y * N + x) * 3; d[i] = v; d[i + 1] = v; d[i + 2] = v; }
};

describe("görsel zemin sınıflandırma", () => {
  it("beyaz zemin düz sayılır, renk köşelerden gelir", () => {
    expect(siniflandirRaw(duz(255, 255, 255))).toEqual({ kind: "plain", color: "#ffffff" });
    expect(siniflandirRaw(duz(240, 244, 247))).toEqual({ kind: "plain", color: "#f0f4f7" });
  });
  it("ortadaki nesne zemini bozmaz; alt kenara değen tekerlek/gölge hiç sayılmaz", () => {
    const d = duz(255, 255, 255);
    boya(d, 8, 10, 16, 14, 20);   // ortada nesne
    boya(d, 0, 28, 32, 4, 150);   // alt kenarın tamamı gölge/zemin (%100) → alt kenar örneklenmez
    expect(siniflandirRaw(d).kind).toBe("plain");
  });
  it("nesne üst kenarın %30'undan, yan kenarın %40'ından fazlasına değiyorsa → düz değil", () => {
    const ust = duz(255, 255, 255); boya(ust, 8, 0, 14, 3, 30);   // üst kenar %44
    expect(siniflandirRaw(ust).kind).toBe("busy");
    const sol = duz(255, 255, 255); boya(sol, 0, 4, 3, 20, 30);   // sol kenar %63
    expect(siniflandirRaw(sol).kind).toBe("busy");
    const sag = duz(255, 255, 255); boya(sag, N - 3, 4, 3, 16, 30); // sağ kenar %50
    expect(siniflandirRaw(sag).kind).toBe("busy");
  });
  it("gidon/sele ucu gibi küçük temas (≤ %30) zemini bozmaz (beyaz stüdyo fotoğrafı kırpılmaz)", () => {
    const d = duz(255, 255, 255);
    boya(d, 13, 0, 6, 3, 30);   // üst kenar %19
    boya(d, 0, 8, 3, 12, 30);   // sol kenar %38 (≤ %40)
    expect(siniflandirRaw(d)).toEqual({ kind: "plain", color: "#ffffff" });
    boya(d, N - 3, 8, 3, 12, 30); // sağ kenar da %38 → ayrı ayrı eşik altında, hâlâ düz
    expect(siniflandirRaw(d).kind).toBe("plain");
  });
  it("köşeler birbirinden çok farklıysa (gradyan/gerçek arka plan) düz değil", () => {
    const d = duz(255, 255, 255);
    boya(d, 0, 0, 3, 3, 90);
    expect(siniflandirRaw(d).kind).toBe("busy");
  });
  it("buffer: şeffaf PNG beyaza düzleştirilir; gürültülü fotoğraf busy", async () => {
    const seffaf = await sharp({ create: { width: 64, height: 64, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } }).png().toBuffer();
    expect(await siniflandirBuffer(seffaf)).toEqual({ kind: "plain", color: "#ffffff" });
    const ham = Buffer.alloc(64 * 64 * 3); for (let i = 0; i < ham.length; i++) ham[i] = (i * 2654435761) % 256; // sahte rastgele
    const gurultu = await sharp(ham, { raw: { width: 64, height: 64, channels: 3 } }).png().toBuffer();
    expect((await siniflandirBuffer(gurultu)).kind).toBe("busy");
  });
});
