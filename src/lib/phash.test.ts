import { describe, it, expect } from "vitest";
import sharp from "sharp";
import { computePHash, hammingDistance, findDuplicatePair, PHASH_DUPLICATE_THRESHOLD } from "./phash";

describe("hammingDistance", () => {
  it("aynı hash için 0 döner", () => {
    expect(hammingDistance("a1b2c3d4e5f60718", "a1b2c3d4e5f60718")).toBe(0);
  });

  it("tek bit farkını doğru sayar", () => {
    // 0x0 vs 0x1 → tek bit farkı
    expect(hammingDistance("0", "1")).toBe(1);
  });

  it("farklı uzunlukta hash için Infinity döner", () => {
    expect(hammingDistance("ab", "abcd")).toBe(Infinity);
  });
});

describe("computePHash", () => {
  it("64 bitlik (16 hex karakter) bir hash üretir", async () => {
    const buffer = await sharp({
      create: { width: 32, height: 32, channels: 3, background: { r: 100, g: 150, b: 200 } },
    }).jpeg().toBuffer();

    const hash = await computePHash(buffer);
    expect(hash).toHaveLength(16);
    expect(hash).toMatch(/^[0-9a-f]{16}$/);
  });

  it("aynı görsel için aynı hash'i üretir", async () => {
    const buffer = await sharp({
      create: { width: 32, height: 32, channels: 3, background: { r: 10, g: 200, b: 30 } },
    }).png().toBuffer();

    const hashA = await computePHash(buffer);
    const hashB = await computePHash(buffer);
    expect(hashA).toBe(hashB);
    expect(hammingDistance(hashA, hashB)).toBeLessThanOrEqual(PHASH_DUPLICATE_THRESHOLD);
  });

  it("belirgin şekilde farklı görseller için uzak hash üretir", async () => {
    const solidBlack = await sharp({
      create: { width: 32, height: 32, channels: 3, background: { r: 0, g: 0, b: 0 } },
    }).png().toBuffer();
    const gradient = await sharp({
      create: { width: 32, height: 32, channels: 3, background: { r: 255, g: 255, b: 255 } },
    })
      .composite([{
        input: Buffer.from(
          `<svg width="32" height="32"><rect x="0" y="0" width="16" height="32" fill="black"/></svg>`
        ),
      }])
      .png()
      .toBuffer();

    const hashA = await computePHash(solidBlack);
    const hashB = await computePHash(gradient);
    expect(hammingDistance(hashA, hashB)).toBeGreaterThan(0);
  });
});

describe("findDuplicatePair", () => {
  it("aynı hash'ten iki tane varsa ilk çifti döner", () => {
    expect(findDuplicatePair(["abc", "def", "abc"])).toEqual([0, 2]);
  });

  it("hiç yakın çift yoksa null döner", () => {
    expect(findDuplicatePair(["0000000000000000", "ffffffffffffffff"])).toBeNull();
  });

  it("null (hesaplanamamış) hash'leri atlar", () => {
    expect(findDuplicatePair([null, "abc", null, "abc"])).toEqual([1, 3]);
  });

  it("boş veya tek elemanlı listede null döner", () => {
    expect(findDuplicatePair([])).toBeNull();
    expect(findDuplicatePair(["abc"])).toBeNull();
  });
});
