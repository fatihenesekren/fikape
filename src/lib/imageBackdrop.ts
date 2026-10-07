import sharp from "sharp";
import { unstable_cache } from "next/cache";

// Küçük ürün görselinde (kart / araç sayfası başlığı) fotoğraf kutuya sığdırılınca kalan boşluğun nasıl
// doldurulacağına karar verir: zemin DÜZ ise (beyaz/stüdyo grisi) kutu o renge boyanır ve fotoğraf içeri
// sığdırılır → "kutu içinde kutu" görünmez; zemin DÜZ DEĞİLSE (fuar salonu, sokak, gradyan, nesne kenara değiyor)
// hiçbir dolgu kutuyu gizleyemez → fotoğraf kutuyu doldurur (cover).
export type Backdrop = { kind: "plain"; color: string } | { kind: "busy" } | { kind: "unknown" };

const N = 32;
type RGB = [number, number, number];

function patch(data: Buffer, x0: number, y0: number, w: number, h: number): { mean: RGB; sd: number } {
  const px: RGB[] = [];
  for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) px.push([0, 1, 2].map((c) => data[(y * N + x) * 3 + c]) as RGB);
  const mean = [0, 1, 2].map((c) => px.reduce((s, v) => s + v[c], 0) / px.length) as RGB;
  const sd = Math.max(...[0, 1, 2].map((c) => Math.sqrt(px.reduce((s, v) => s + (v[c] - mean[c]) ** 2, 0) / px.length)));
  return { mean, sd };
}
const fark = (a: RGB, b: RGB) => Math.max(Math.abs(a[0] - b[0]), Math.abs(a[1] - b[1]), Math.abs(a[2] - b[2]));
const hex = (m: RGB) => "#" + m.map((v) => Math.round(v).toString(16).padStart(2, "0")).join("");

/**
 * Saf karar fonksiyonu (test edilebilir): 32×32 RGB ham veriden zemin türü.
 * Boşluk nerede oluşacaksa orası örneklenir: GENİŞ fotoğraf (en/boy ≥ 1.25) kutuya sığınca üstte/altta boşluk kalır →
 * üst köşeler + üst orta; KARE/DİKEY fotoğrafta yanlarda kalır → üst köşeler + yan ortalar (üst yarı).
 * Alt kısım hiç örneklenmez: tekerlek/gölge/zemin çizgisi kenara değer (beyaz zeminli fotoğrafta bile).
 */
export function siniflandirRaw(data: Buffer, genis: boolean): Backdrop {
  const koseler = [patch(data, 0, 0, 3, 3), patch(data, N - 3, 0, 3, 3)];
  const ort = [0, 1, 2].map((c) => (koseler[0].mean[c] + koseler[1].mean[c]) / 2) as RGB;
  if (koseler.some((k) => k.sd > 14 || fark(k.mean, ort) > 14)) return { kind: "busy" };
  const kenarlar = genis ? [patch(data, 13, 0, 6, 3)] : [patch(data, 0, 8, 3, 6), patch(data, N - 3, 8, 3, 6)];
  if (kenarlar.some((k) => k.sd > 14 || fark(k.mean, ort) > 20)) return { kind: "busy" };
  return { kind: "plain", color: hex(ort) };
}

export async function siniflandirBuffer(buf: Buffer): Promise<Backdrop> {
  const meta = await sharp(buf).metadata();
  const genis = (meta.width ?? 1) / (meta.height ?? 1) >= 1.25;
  const data = await sharp(buf).flatten({ background: "#ffffff" }).resize(N, N, { fit: "fill" }).removeAlpha().raw().toBuffer();
  return siniflandirRaw(data, genis);
}

async function hesapla(url: string): Promise<Backdrop> {
  const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error(`görsel indirilemedi: ${res.status}`);
  return siniflandirBuffer(Buffer.from(await res.arrayBuffer()));
}

/** Aynı görsel adresi (sürüm parametresiyle birlikte) için sonuç kalıcı önbelleklenir; hata olursa "unknown" döner (önbelleklenmez). */
export async function getImageBackdrop(url: string): Promise<Backdrop> {
  try {
    return await unstable_cache(() => hesapla(url), ["image-backdrop-v1", url], { revalidate: 60 * 60 * 24 * 365 })();
  } catch {
    return { kind: "unknown" };
  }
}
