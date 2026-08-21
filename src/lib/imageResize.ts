import sharp from "sharp";

// Katalog fotoğrafları için tek kaynak küçültme mantığı — hem admin
// upload/URL-yapıştırma akışında (DB'ye kaydedilmeden önce) hem de kart.png
// paylaşım kartı render'ında (satori'ye vermeden önce) kullanılıyor. Kök
// nedeni (orijinal çözünürlükte, birkaç MB'lık dosyaların hiç küçültülmeden
// saklanması) kaynağında çözüyor — bkz. kullanıcı geri bildirimi: "12.8MB'lık
// Togg T10F fotoğrafı" satori render'ını başarısız kılıyordu.
const MAX_WIDTH = 1600;
const JPEG_QUALITY = 82;

export interface ResizedImage {
  buffer: Buffer;
  contentType: "image/jpeg";
}

/** Bir Buffer/Blob'u en fazla MAX_WIDTH genişlikte, JPEG'e sıkıştırılmış hale getirir. */
export async function resizeImageBuffer(input: Buffer): Promise<ResizedImage> {
  const buffer = await sharp(input)
    .rotate() // EXIF orientation'a göre düzelt
    .resize({ width: MAX_WIDTH, withoutEnlargement: true })
    .jpeg({ quality: JPEG_QUALITY, mozjpeg: true })
    .toBuffer();
  return { buffer, contentType: "image/jpeg" };
}

/** Bir URL'den görsel indirip küçültür. Ağ/format hatalarında null döner (best-effort). */
export async function fetchAndResizeImage(url: string, timeoutMs = 8000): Promise<ResizedImage | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) });
    if (!res.ok) return null;
    const arrayBuffer = await res.arrayBuffer();
    return await resizeImageBuffer(Buffer.from(arrayBuffer));
  } catch {
    return null;
  }
}
