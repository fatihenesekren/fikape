import sharp from "sharp";

// dHash (difference hash) — 9x8 gri tonlama, komşu piksel karşılaştırması → 64 bit.
// Küçük kırpma/yeniden boyutlandırma/hafif kalite farklarına dayanıklı, tam kopya olmayan
// ama görsel olarak neredeyse aynı fotoğrafları da yakalar.
export async function computePHash(buffer: Buffer): Promise<string> {
  const { data } = await sharp(buffer)
    .resize(9, 8, { fit: "fill" })
    .greyscale()
    .raw()
    .toBuffer({ resolveWithObject: true });

  let bits = "";
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const left = data[row * 9 + col];
      const right = data[row * 9 + col + 1];
      bits += left > right ? "1" : "0";
    }
  }

  // 64 bitlik ikili string'i hex'e çevir (16 karakter)
  let hex = "";
  for (let i = 0; i < 64; i += 4) {
    hex += parseInt(bits.slice(i, i + 4), 2).toString(16);
  }
  return hex;
}

export function hammingDistance(hexA: string, hexB: string): number {
  if (hexA.length !== hexB.length) return Infinity;
  let distance = 0;
  for (let i = 0; i < hexA.length; i++) {
    const xor = parseInt(hexA[i], 16) ^ parseInt(hexB[i], 16);
    distance += xor.toString(2).split("1").length - 1;
  }
  return distance;
}

// 64 bitten <=6 farklı bit → görsel olarak neredeyse aynı kabul edilir
export const PHASH_DUPLICATE_THRESHOLD = 6;
