import { guvenliGorselIndir } from "@/lib/guvenliGorselIndir";
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

/** Üst kenar çizgisinin en çok bu oranı zeminden sapabilir (gidon/sele ucu gibi küçük temas). */
export const UST_KENAR_ESIGI = 0.3;
/** Sol/sağ kenar çizgisi için eşik (tekerlek uçları fotoğraf kenarına teğet geçebilir). */
export const YAN_KENAR_ESIGI = 0.4;

/**
 * Saf karar fonksiyonu (test edilebilir): 32×32 RGB ham veriden zemin türü.
 * 1) Üst iki köşe düz ve birbirine yakın olmalı (gradyan/gerçek arka plan → "busy").
 * 2) Üst kenar çizgisinde zeminden sapan piksel oranı en çok %30, sol ve sağ kenar çizgilerinde en çok %40 olmalı.
 *    Boşluk hangi kenarda oluşursa oluşsun (kutunun oranı fotoğraftan farklıdır) görünür bir dikiş yalnızca nesne
 *    o kenara yaygın biçimde değiyorsa çıkar; tekerlek/gidon ucu gibi küçük temas beyaz zeminde fark edilmez,
 *    oysa kırpmak (cover) nesneyi (sele, tekerlek altı) keser.
 * 3) ALT kenar hiç örneklenmez: tekerlek, yer gölgesi ve zemin çizgisi doğal olarak alt kenara değer.
 * Eski sürüm üstteki kalın bir yamaya (~%9) bakıyordu; beyaz stüdyo fotoğraflarını (gidon ucu yamaya girince) gereksiz kırpıyordu.
 */
export function siniflandirRaw(data: Buffer): Backdrop {
  const koseler = [patch(data, 0, 0, 3, 3), patch(data, N - 3, 0, 3, 3)];
  const ort = [0, 1, 2].map((c) => (koseler[0].mean[c] + koseler[1].mean[c]) / 2) as RGB;
  if (koseler.some((k) => k.sd > 14 || fark(k.mean, ort) > 14)) return { kind: "busy" };
  const kenarlar: { cizgi: (i: number) => [number, number]; esik: number }[] = [
    { cizgi: (i) => [i, 0], esik: UST_KENAR_ESIGI },
    { cizgi: (i) => [0, i], esik: YAN_KENAR_ESIGI },
    { cizgi: (i) => [N - 1, i], esik: YAN_KENAR_ESIGI },
  ];
  for (const { cizgi, esik } of kenarlar) {
    let sapan = 0;
    for (let i = 0; i < N; i++) {
      const [x, y] = cizgi(i);
      const px = [0, 1, 2].map((c) => data[(y * N + x) * 3 + c]) as RGB;
      if (fark(px, ort) > 24) sapan++;
    }
    if (sapan / N > esik) return { kind: "busy" };
  }
  return { kind: "plain", color: hex(ort) };
}

export async function siniflandirBuffer(buf: Buffer): Promise<Backdrop> {
  const data = await sharp(buf).flatten({ background: "#ffffff" }).resize(N, N, { fit: "fill" }).removeAlpha().raw().toBuffer();
  return siniflandirRaw(data);
}

async function hesapla(url: string): Promise<Backdrop> {
  // Ürün görsel adresi iç ağa/metadata'ya işaret edemez; yönlendirme, tür ve boyut sınırı uygulanır.
  const { buffer } = await guvenliGorselIndir(url, { zamanAsimiMs: 8000 });
  return siniflandirBuffer(buffer);
}

/** Aynı görsel adresi (sürüm parametresiyle birlikte) için sonuç kalıcı önbelleklenir; hata olursa "unknown" döner (önbelleklenmez). */
export async function getImageBackdrop(url: string): Promise<Backdrop> {
  try {
    return await unstable_cache(() => hesapla(url), ["image-backdrop-v3", url], { revalidate: 60 * 60 * 24 * 365 })();
  } catch {
    return { kind: "unknown" };
  }
}

/**
 * Zemini düz olmayan (busy) fotoğraf kutuyu doldururken (cover) dikey/kareye yakın bir fotoğrafta aracı üstten-alttan
 * keser (örn. gidonu/dikme boyu uzun scooter: kart ~1,8:1, fotoğraf ~1,25:1). Oranı bu değerin altındaki busy
 * fotoğraflar kırpılmaz; kendi bulanık kopyası üzerine sığdırılır (BackdropImage).
 */
export const BUSY_SIGDIR_ESIGI = 1.45;

async function oranHesapla(url: string): Promise<number | null> {
  const { buffer } = await guvenliGorselIndir(url, { zamanAsimiMs: 8000 });
  const m = await sharp(buffer).metadata();
  return m.width && m.height ? m.width / m.height : null;
}

/** Fotoğrafın en/boy oranı (kalıcı önbellekli); okunamazsa null. */
export async function getImageOran(url: string): Promise<number | null> {
  try {
    return await unstable_cache(() => oranHesapla(url), ["image-oran-v1", url], { revalidate: 60 * 60 * 24 * 365 })();
  } catch {
    return null;
  }
}

/** Fotoğrafın sol ve sağ kenar şeridinin dikey renk dizisi (üstten alta). Boşluk bu renklerle doldurulunca fotoğraf kenarı zemine dikişsiz karışır. */
export type KenarRenkleri = { sol: string[]; sag: string[] };
const KENAR_ADIM = 7;

async function kenarHesapla(url: string): Promise<KenarRenkleri> {
  const { buffer } = await guvenliGorselIndir(url, { zamanAsimiMs: 8000 });
  const img = sharp(buffer).flatten({ background: "#ffffff" });
  const m = await img.metadata();
  const w = m.width ?? 0, h = m.height ?? 0;
  if (!w || !h) throw new Error("boyut yok");
  const serit = Math.max(2, Math.round(w * 0.03));
  const renkler = async (left: number) => {
    const raw = await sharp(buffer).flatten({ background: "#ffffff" }).extract({ left, top: 0, width: serit, height: h }).resize(1, KENAR_ADIM, { fit: "fill" }).removeAlpha().raw().toBuffer();
    return Array.from({ length: KENAR_ADIM }, (_, i) => hex([raw[i * 3], raw[i * 3 + 1], raw[i * 3 + 2]] as RGB));
  };
  return { sol: await renkler(0), sag: await renkler(w - serit) };
}

export async function getImageKenarRenkleri(url: string): Promise<KenarRenkleri | null> {
  try {
    return await unstable_cache(() => kenarHesapla(url), ["image-kenar-v1", url], { revalidate: 60 * 60 * 24 * 365 })();
  } catch {
    return null;
  }
}
