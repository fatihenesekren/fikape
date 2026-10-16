import sharp from "sharp";

const IZINLI_TURLER = ["image/jpeg", "image/png", "image/webp"];
const VARSAYILAN_MAX_BAYT = 10 * 1024 * 1024;

type Sonuc = { ok: true; buffer: Buffer } | { ok: false; error: string; status: number };

/**
 * Yönetici yüklemesi (bulanıklaştırılmış görsel vb.) için ortak doğrulama: tür beyaz listesi, boyut sınırı ve
 * sharp ile yeniden kodlama (geçerli raster görsel değilse reddeder; EXIF/gömülü içerik kalmaz). Çıktı her zaman JPEG.
 */
export async function yuklenenGorseliDogrula(file: File | null, maxBayt = VARSAYILAN_MAX_BAYT): Promise<Sonuc> {
  if (!file) return { ok: false, error: "Dosya gerekli.", status: 400 };
  if (!IZINLI_TURLER.includes(file.type)) return { ok: false, error: "Geçersiz dosya türü.", status: 400 };
  if (file.size > maxBayt) return { ok: false, error: "Dosya çok büyük.", status: 400 };
  try {
    const buffer = await sharp(Buffer.from(await file.arrayBuffer()), { limitInputPixels: 50_000_000 })
      .rotate()
      .jpeg({ quality: 90 })
      .toBuffer();
    return { ok: true, buffer };
  } catch {
    return { ok: false, error: "Geçersiz görsel dosyası.", status: 400 };
  }
}
