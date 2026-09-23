// Araç Öner — otomobil/kamyonet adım adım seçim mantığı (saf fonksiyonlar).
//
// Her adım bir öncekinin seçimine göre gerçek TSB tiplerini süzer; bu yüzden
// var olmayan bir kombinasyon (ör. 2019 Egea Lounge + 1.4 Fire) seçilemez.
// Yakıt/vites yalnız kalan tiplerin HEPSİ aynı kesin değeri taşıyorsa kilitlenir;
// kaynak söylemiyorsa (null) kullanıcı seçer — tahmin yapılmaz.
//
// 2012 öncesi yıllar (TSB kapsamı dışı) eski katalogdaki nesil seçenekleriyle
// ("el") sunulur; o yıllarda yakıt/vites her zaman kullanıcıdan istenir.
import type { KatalogModel, KatalogNesil, KatalogTip, KatalogVites, KatalogYakit } from "./tipler";

export const BUGUN_YIL = new Date().getFullYear();
const TSB_ILK_YIL = 2012;

/** Modelin seçilebilir yılları (büyükten küçüğe). */
export function modelYillari(model: KatalogModel): number[] {
  const set = new Set<number>();
  for (const t of model.tipler) t.y.forEach((y) => set.add(y));
  for (const n of model.nesiller) {
    if (!n.el) continue;
    // TSB tipi olan modelde eski nesil yalnız TSB öncesi yılları doldurur
    const son = model.tipler.length ? Math.min(n.bit ?? TSB_ILK_YIL - 1, TSB_ILK_YIL - 1) : (n.bit ?? BUGUN_YIL);
    for (let y = n.bas; y <= son; y++) set.add(y);
  }
  return [...set].sort((a, b) => b - a);
}

/** Seçilen yılda TSB tipleri var mı? Yoksa o yıl eski katalog nesilleriyle sunulur. */
export function yilTipleri(model: KatalogModel, yil: number): KatalogTip[] {
  return model.tipler.filter((t) => t.y.includes(yil));
}

/** TSB tipi olmayan yıllar için o yılı kapsayan eski nesiller. */
export function yilNesilleri(model: KatalogModel, yil: number): KatalogNesil[] {
  return model.nesiller.filter((n) => n.el && n.bas <= yil && yil <= (n.bit ?? BUGUN_YIL));
}

export const VERSIYON_YOK = "Versiyon belirtilmemiş";

/** Versiyon etiketi: "1.6 E-Torq · 110 HP". Aynı etiketli tipler tek seçenek olur. */
export function versiyonEtiketi(t: Pick<KatalogTip, "v" | "hp">): string {
  const v = t.v || VERSIYON_YOK;
  return t.hp ? `${v} · ${t.hp} HP` : v;
}

/**
 * Kaynakta bu tiplerin HİÇBİRİNDE motor metni ya da beygir yoksa (yalnızca
 * donanım paketiyle ayrışan araçlar, ör. bazı klasik/lüks modeller) Versiyon
 * adımının gösterilmesi anlamsız — tek seçenek olsa bile içi boş bir
 * "Versiyon belirtilmemiş" rozeti kullanıcıya bir şey söylemez.
 */
export const versiyonBilgisiVarMi = (tipler: KatalogTip[]) => tipler.some((t) => t.v || t.hp);

export const PAKET_YOK = "Paket adı belirtilmemiş";
export const KASA_YOK = "Kasa tipi belirtilmemiş";

const benzersiz = (liste: string[]) => [...new Set(liste)].sort((a, b) => a.localeCompare(b, "tr", { numeric: true }));

export const kasaSecenekleri = (tipler: KatalogTip[]) => benzersiz(tipler.map((t) => t.k ?? KASA_YOK));
export const versiyonSecenekleri = (tipler: KatalogTip[]) => benzersiz(tipler.map(versiyonEtiketi));
export const paketSecenekleri = (tipler: KatalogTip[]) => benzersiz(tipler.map((t) => t.p ?? PAKET_YOK));

export const kasayaGore = (tipler: KatalogTip[], kasa: string) => tipler.filter((t) => (t.k ?? KASA_YOK) === kasa);
export const versiyonaGore = (tipler: KatalogTip[], etiket: string) => tipler.filter((t) => versiyonEtiketi(t) === etiket);
export const paketeGore = (tipler: KatalogTip[], paket: string) => tipler.filter((t) => (t.p ?? PAKET_YOK) === paket);

/**
 * Yakıt/vites için kalan tiplerin söylediği:
 *   { kilitli: X }      — hepsi aynı kesin değer → alan dolu ve değiştirilemez
 *   { secenekler: [...] } — birden fazla kesin değer → yalnız bunlar arasından seçilir
 *   { serbest: true }   — en az biri bilinmiyor → kullanıcı tüm listeden seçer
 */
export type AlanDurumu<T> = { kilitli: T } | { secenekler: T[] } | { serbest: true };

function alanDurumu<T>(degerler: (T | null)[]): AlanDurumu<T> {
  if (!degerler.length || degerler.some((d) => d === null)) return { serbest: true };
  const set = [...new Set(degerler as T[])];
  return set.length === 1 ? { kilitli: set[0] } : { secenekler: set };
}

export const yakitDurumu = (tipler: KatalogTip[]): AlanDurumu<KatalogYakit> => alanDurumu(tipler.map((t) => t.f));
export const vitesDurumu = (tipler: KatalogTip[]): AlanDurumu<KatalogVites> => alanDurumu(tipler.map((t) => t.t));

/** Kalan tiplerin hepsi aynı beygirdeyse o değer (power_hp olarak gönderilir). */
export function ortakBeygir(tipler: KatalogTip[]): number | null {
  const set = new Set(tipler.map((t) => t.hp));
  return set.size === 1 ? [...set][0] : null;
}

/** Ürünün kalıcı adına girecek metin: "1.6 E-Torq – Urban" (beygir ayrı alanda tutulur). */
export function trimAdi(versiyon: string | null, paket: string | null): string {
  return [versiyon, paket].filter((x) => x && x !== PAKET_YOK && x !== VERSIYON_YOK).join(" – ");
}
