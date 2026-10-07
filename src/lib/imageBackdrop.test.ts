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
    expect(siniflandirRaw(duz(255, 255, 255), false)).toEqual({ kind: "plain", color: "#ffffff" });
    expect(siniflandirRaw(duz(240, 244, 247), true)).toEqual({ kind: "plain", color: "#f0f4f7" });
  });
  it("ortadaki nesne zemini bozmaz; alt kısımdaki tekerlek/gölge sayılmaz", () => {
    const d = duz(255, 255, 255);
    boya(d, 8, 10, 16, 14, 20);   // ortada nesne
    boya(d, 0, 24, 6, 8, 30);     // sol altta tekerlek kenara değiyor
    expect(siniflandirRaw(d, false).kind).toBe("plain");
  });
  it("kare fotoğrafta yan kenara değen nesne → düz değil", () => {
    const d = duz(255, 255, 255);
    boya(d, 0, 8, 3, 6, 30);
    expect(siniflandirRaw(d, false).kind).toBe("busy");
    expect(siniflandirRaw(d, true).kind).toBe("plain"); // geniş fotoğrafta yanlarda boşluk oluşmaz
  });
  it("geniş fotoğrafta üst kenara değen nesne → düz değil", () => {
    const d = duz(255, 255, 255);
    boya(d, 13, 0, 6, 3, 30);
    expect(siniflandirRaw(d, true).kind).toBe("busy");
  });
  it("köşeler birbirinden çok farklıysa (gradyan/gerçek arka plan) düz değil", () => {
    const d = duz(255, 255, 255);
    boya(d, 0, 0, 3, 3, 90);
    expect(siniflandirRaw(d, false).kind).toBe("busy");
  });
  it("buffer: şeffaf PNG beyaza düzleştirilir; gürültülü fotoğraf busy", async () => {
    const seffaf = await sharp({ create: { width: 64, height: 64, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } }).png().toBuffer();
    expect(await siniflandirBuffer(seffaf)).toEqual({ kind: "plain", color: "#ffffff" });
    const ham = Buffer.alloc(64 * 64 * 3); for (let i = 0; i < ham.length; i++) ham[i] = (i * 2654435761) % 256; // sahte rastgele
    const gurultu = await sharp(ham, { raw: { width: 64, height: 64, channels: 3 } }).png().toBuffer();
    expect((await siniflandirBuffer(gurultu)).kind).toBe("busy");
  });
});
